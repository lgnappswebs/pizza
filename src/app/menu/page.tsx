
"use client"

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/pizzeria/Header';
import { Footer } from '@/components/pizzeria/Footer';
import { ProductCard } from '@/components/pizzeria/ProductCard';
import { MenuBanner } from '@/components/pizzeria/MenuBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBasket, 
  Pizza as PizzaIcon, 
  Loader2, 
  Search, 
  X, 
  Beer,
  Package,
  IceCream,
  LayoutGrid,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('all');
  const [activeCategory, setActiveCategory] = useState<string | null>('loading');
  
  const { user } = useUser();
  const cartItems = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const firestore = useFirestore();

  const isAdmin = useMemo(() => {
    const adminEmails = ['lgngregorio@icloud.com', 'admin@pizzapp.com'];
    return user?.email && adminEmails.includes(user.email);
  }, [user]);

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const bannersQuery = useMemoFirebase(() => collection(firestore, 'banners'), [firestore]);

  const { data: categories, isLoading: loadingCats } = useCollection(categoriesQuery);
  const { data: products, isLoading: loadingProds } = useCollection(productsQuery);
  const { data: configs } = useCollection(configQuery);
  const { data: banners } = useCollection(bannersQuery);
  
  const config = configs?.[0];

  const groupedCategories = useMemo(() => {
    if (!categories) return {};
    const groups: Record<string, any[]> = {};
    categories.forEach(cat => {
      const name = cat.name || 'Outros';
      if (!groups[name]) groups[name] = [];
      groups[name].push(cat);
    });
    return groups;
  }, [categories]);

  const mainNames = useMemo(() => {
    return Object.keys(groupedCategories).sort((a, b) => {
      const aLow = a.trim().toLowerCase();
      const bLow = b.trim().toLowerCase();
      const isAPizza = aLow.includes('pizza');
      const isBPizza = bLow.includes('pizza');
      if (isAPizza && !isBPizza) return -1;
      if (!isAPizza && isBPizza) return 1;
      const minA = Math.min(...groupedCategories[a].map(c => c.order ?? 99));
      const minB = Math.min(...groupedCategories[b].map(c => c.order ?? 99));
      return minA - minB;
    });
  }, [groupedCategories]);

  useEffect(() => {
    if (mainNames.length > 0 && (activeCategory === 'loading' || !activeCategory)) {
      const pizzaName = mainNames.find(n => n.toLowerCase().includes('pizza'));
      setActiveCategory(pizzaName || mainNames[0]);
    }
  }, [mainNames, activeCategory]);

  const activeBanners = useMemo(() => banners?.filter(b => b.isActive) || [], [banners]);
  const topBanners = useMemo(() => activeBanners.filter(b => b.bannerPosition === 'top'), [activeBanners]);
  const middleBanners = useMemo(() => activeBanners.filter(b => b.bannerPosition === 'middle'), [activeBanners]);
  const bottomBanners = useMemo(() => activeBanners.filter(b => b.bannerPosition === 'bottom'), [activeBanners]);

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pizza')) return <PizzaIcon className="h-5 w-5" />;
    if (lowerName.includes('bebida')) return <Beer className="h-5 w-5" />;
    if (lowerName.includes('combo')) return <Package className="h-5 w-5" />;
    if (lowerName.includes('sobremesa')) return <IceCream className="h-5 w-5" />;
    return <LayoutGrid className="h-5 w-5" />;
  };

  const searchedProducts = useMemo(() => {
    if (!products || !searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower));
  }, [products, searchTerm]);

  const handleBannerClick = (linkCategoryId: string) => {
    if (!linkCategoryId || linkCategoryId === 'none') return;
    const targetCat = categories?.find(c => c.id === linkCategoryId);
    if (targetCat) {
      setActiveCategory(targetCat.name);
      setSelectedSubId(targetCat.id);
      document.getElementById('menu-navigation')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderBannerContent = (bannerList: any[]) => {
    if (bannerList.length === 0) return null;
    if (bannerList.length === 1) return <MenuBanner banner={bannerList[0]} onBannerClick={handleBannerClick} />;
    return (
      <Carousel 
        opts={{ loop: true }} 
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]} 
        className="w-full"
      >
        <CarouselContent>
          {bannerList.map((banner) => (
            <CarouselItem key={banner.id}>
              <MenuBanner banner={banner} onBannerClick={handleBannerClick} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  };

  if (loadingCats || loadingProds) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <div className="container mx-auto px-4 py-8">
          {config && !config.isStoreOpen && (
            <Alert variant="destructive" className="mb-8 rounded-3xl border-2 bg-red-50 shadow-xl">
              <div className="flex gap-4">
                <div className="bg-red-600 p-3 rounded-2xl h-fit"><Clock className="h-6 w-6 text-white" /></div>
                <div>
                  <AlertTitle className="text-2xl font-black mb-1">Pizzaria Fechada</AlertTitle>
                  <AlertDescription className="text-lg">
                    <p className="font-semibold">{config.closedMessage || "Estamos fechados no momento."}</p>
                    {config.openingHoursText && <div className="mt-2 inline-flex items-center gap-2 bg-red-900/10 px-3 py-1 rounded-full text-sm font-bold">{config.openingHoursText}</div>}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="mb-10 text-center space-y-3">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-primary">{config?.menuTitle || "Nosso Cardápio"}</h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium">{config?.menuSubtitle || "Escolha suas favoritas"}</p>
          </div>

          <div className="max-w-xl mx-auto mb-12 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="O que deseja saborear hoje?" className="h-14 pl-12 pr-12 rounded-full border-2 text-lg font-black shadow-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground p-1"><X className="h-5 w-5" /></button>}
          </div>

          {!searchTerm && topBanners.length > 0 && <div className="mb-12">{renderBannerContent(topBanners)}</div>}

          {searchTerm.trim() ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-black">Resultados para "{searchTerm}"</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchedProducts.map(p => <ProductCard key={p.id} {...p} category={p.categoryId} />)}
              </div>
            </div>
          ) : (
            <Tabs value={activeCategory || undefined} className="w-full" onValueChange={setActiveCategory}>
              <div id="menu-navigation" className="flex justify-start md:justify-center mb-12 overflow-x-auto pb-4 no-scrollbar">
                <TabsList className="bg-transparent h-auto flex gap-3">
                  {mainNames.map((name) => (
                    <TabsTrigger key={name} value={name} className="rounded-2xl px-6 py-3 text-base md:text-lg font-black border-2 border-muted data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm whitespace-nowrap">
                      {getCategoryIcon(name)} <span className="ml-2">{name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {mainNames.map((name) => (
                <TabsContent key={name} value={name} className="space-y-10">
                  {groupedCategories[name].length > 1 && (
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button variant={selectedSubId === 'all' ? 'default' : 'outline'} onClick={() => setSelectedSubId('all')} className="rounded-2xl h-12 px-8 font-black border-2">Tudo</Button>
                      {groupedCategories[name].map(sub => <Button key={sub.id} variant={selectedSubId === sub.id ? 'default' : 'outline'} onClick={() => setSelectedSubId(sub.id)} className="rounded-2xl h-12 px-8 font-black border-2">{sub.subName || 'Geral'}</Button>)}
                    </div>
                  )}
                  {activeCategory === name && middleBanners.length > 0 && <div className="animate-in fade-in">{renderBannerContent(middleBanners)}</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    {products?.filter(p => {
                      const pCat = categories?.find(c => c.id === p.categoryId);
                      return pCat && pCat.name === name && (selectedSubId === 'all' || p.categoryId === selectedSubId);
                    }).map(product => <ProductCard key={product.id} {...product} category={product.categoryId} />)}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          {!searchTerm && bottomBanners.length > 0 && <div className="mt-16">{renderBannerContent(bottomBanners)}</div>}
        </div>
      </main>
      <Footer />
      
      {/* Botão flutuante do Admin */}
      {isAdmin && (
        <div className={cn(
          "fixed z-50 transition-all",
          cartItems.length > 0 ? "bottom-32 right-6 md:bottom-36 md:right-12" : "bottom-8 right-6 md:bottom-12 md:right-12"
        )}>
          <Link href="/admin/dashboard">
            <Button className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-white/30">
              <ShieldCheck className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      )}

      {cartItems.length > 0 && config?.isStoreOpen && (
        <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-12 z-40 flex justify-center">
          <Link href="/checkout" className="w-full max-w-md">
            <Button className="h-20 w-full px-6 rounded-[2.5rem] bg-secondary text-secondary-foreground text-xl md:text-2xl font-black shadow-2xl flex items-center justify-between border-4 border-white/30">
              <div className="flex items-center gap-3"><ShoppingBasket className="h-7 w-7" /> Ver Pedido</div>
              <div className="bg-black/15 px-4 py-2 rounded-2xl">R$ {total.toFixed(2)}</div>
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
