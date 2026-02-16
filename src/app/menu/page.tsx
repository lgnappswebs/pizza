
"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
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
  Filter,
  Beer,
  Package,
  IceCream,
  Utensils,
  Salad,
  LayoutGrid,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('all');
  const [activeCategory, setActiveCategory] = useState<string | null>('loading');
  const [showSpecialties, setShowSpecialties] = useState(false);
  
  const cartItems = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const firestore = useFirestore();
  const { user } = useUser();

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const bannersQuery = useMemoFirebase(() => collection(firestore, 'banners'), [firestore]);

  const { data: categories, isLoading: loadingCats } = useCollection(categoriesQuery);
  const { data: products, isLoading: loadingProds } = useCollection(productsQuery);
  const { data: configs, isLoading: loadingConfigs } = useCollection(configQuery);
  const { data: banners, isLoading: loadingBanners } = useCollection(bannersQuery);
  
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
    const names = Object.keys(groupedCategories).sort((a, b) => {
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
    return names;
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
    if (lowerName.includes('porç') || lowerName.includes('entrada')) return <Utensils className="h-5 w-5" />;
    if (lowerName.includes('acompanhamento')) return <Salad className="h-5 w-5" />;
    return <LayoutGrid className="h-5 w-5" />;
  };

  const searchedProducts = useMemo(() => {
    if (!products || !searchTerm.trim()) return [];
    const searchLower = searchTerm.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower));
  }, [products, searchTerm]);

  const isAdmin = user && (user.email === 'lgngregorio@icloud.com' || user.email === 'admin@pizzapp.com');

  const handleBannerClick = (linkCategoryId: string) => {
    if (!linkCategoryId || linkCategoryId === 'none') return;
    const targetCat = categories?.find(c => c.id === linkCategoryId);
    if (targetCat) {
      setActiveCategory(targetCat.name);
      setSelectedSubId(targetCat.id);
      setShowSpecialties(true);
      document.getElementById('menu-navigation')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderBannerContent = (bannerList: any[]) => {
    if (bannerList.length === 0) return null;
    if (bannerList.length === 1) return <MenuBanner banner={bannerList[0]} onBannerClick={handleBannerClick} />;
    return (
      <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]} className="w-full">
        <CarouselContent>
          {bannerList.map((banner) => (
            <CarouselItem key={banner.id}><MenuBanner banner={banner} onBannerClick={handleBannerClick} /></CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  };

  if (loadingCats || loadingProds || loadingConfigs || loadingBanners) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <div className="container mx-auto px-4 py-8">
          {config && !config.isStoreOpen && (
            <Alert variant="destructive" className="mb-8 rounded-3xl border-2 bg-red-50 shadow-xl animate-in fade-in zoom-in-95">
              <div className="flex gap-4">
                <div className="bg-red-600 p-3 rounded-2xl h-fit"><Clock className="h-6 w-6 text-white" /></div>
                <div>
                  <AlertTitle className="text-2xl font-black mb-1">Pizzaria Fechada</AlertTitle>
                  <AlertDescription className="text-lg">
                    <p className="font-semibold opacity-90">{config.closedMessage || "Estamos fechados no momento."}</p>
                    {config.openingHoursText && <div className="mt-2 inline-flex items-center gap-2 bg-red-900/10 px-3 py-1 rounded-full text-sm font-bold"><span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />{config.openingHoursText}</div>}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="mb-10 text-center space-y-3 animate-in fade-in duration-700">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-primary">{config?.menuTitle || "Nosso Cardápio"}</h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">{config?.menuSubtitle || "Escolha suas pizzas favoritas e monte seu pedido"}</p>
          </div>

          <div className="max-w-xl mx-auto mb-12 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            <Input placeholder="O que deseja saborear hoje?" className="h-14 md:h-16 pl-12 md:pl-14 pr-12 rounded-full border-2 text-lg sm:text-xl font-black shadow-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded-full"><X className="h-5 w-5" /></button>}
          </div>

          {!searchTerm && topBanners.length > 0 && <div className="mb-12">{renderBannerContent(topBanners)}</div>}

          {searchTerm.trim() ? (
            <div className="animate-in fade-in slide-in-from-top-4 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 p-6 rounded-3xl border-2 border-dashed border-primary/20">
                <h2 className="text-2xl font-black">Resultados para "{searchTerm}"</h2>
                <Button onClick={() => setSearchTerm('')} variant="outline" className="rounded-full border-2 font-bold px-8 h-12">Limpar Busca</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchedProducts.map(p => <ProductCard key={p.id} {...p} />)}
              </div>
              {searchedProducts.length === 0 && <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed"><Search className="h-20 w-20 text-muted-foreground/20 mx-auto mb-6" /><h3 className="text-3xl font-black opacity-80">Nenhum item encontrado</h3></div>}
            </div>
          ) : (
            <Tabs value={activeCategory || undefined} className="w-full" onValueChange={setActiveCategory}>
              <div id="menu-navigation" className="flex justify-start md:justify-center mb-12 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                <TabsList className="bg-transparent h-auto flex gap-3 md:gap-4 justify-start md:justify-center border-none">
                  {mainNames.map((name) => (
                    <TabsTrigger key={name} value={name} onClick={() => { if (activeCategory === name) setShowSpecialties(!showSpecialties); else { setActiveCategory(name); setShowSpecialties(true); setSelectedSubId('all'); } }} className="rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-black tracking-tight border-2 border-muted data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-sm whitespace-nowrap">
                      {getCategoryIcon(name)} <span className="ml-2">{name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {mainNames.map((name) => (
                <TabsContent key={name} value={name} className="animate-in fade-in duration-500 space-y-10">
                  {groupedCategories[name].length > 1 && activeCategory === name && showSpecialties && (
                    <div className="flex flex-col items-center gap-5 animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/50 rounded-full border"><Filter className="h-3.5 w-3.5" /><span className="text-[10px] font-black uppercase tracking-widest">Especialidade</span></div>
                        <Button variant="ghost" size="sm" onClick={() => setShowSpecialties(false)} className="h-8 rounded-full text-[10px] font-black uppercase">Ocultar Filtros</Button>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                        <Button variant={selectedSubId === 'all' ? 'default' : 'outline'} onClick={() => setSelectedSubId('all')} className={cn("rounded-2xl h-12 px-8 font-black border-2", selectedSubId === 'all' ? "bg-primary text-white scale-105" : "bg-white")}>Tudo</Button>
                        {groupedCategories[name].map(sub => <Button key={sub.id} variant={selectedSubId === sub.id ? 'default' : 'outline'} onClick={() => setSelectedSubId(sub.id)} className={cn("rounded-2xl h-12 px-8 font-black border-2", selectedSubId === sub.id ? "bg-primary text-white scale-105" : "bg-white")}>{sub.subName || 'Geral'}</Button>)}
                      </div>
                    </div>
                  )}
                  {activeCategory === name && middleBanners.length > 0 && <div className="animate-in fade-in">{renderBannerContent(middleBanners)}</div>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    {products?.filter(p => {
                      const pCat = categories?.find(c => c.id === p.categoryId);
                      return pCat && pCat.name === name && (selectedSubId === 'all' || p.categoryId === selectedSubId);
                    }).map(product => <ProductCard key={product.id} {...product} />)}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          {!searchTerm && bottomBanners.length > 0 && <div className="mt-16">{renderBannerContent(bottomBanners)}</div>}
        </div>
      </main>
      <Footer />
      {cartItems.length > 0 && config?.isStoreOpen && (
        <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-12 z-40 flex justify-center md:justify-end">
          <Link href="/checkout" className="w-full max-w-md md:w-auto">
            <Button className="h-20 w-full px-6 rounded-[2.5rem] bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xl md:text-2xl font-black shadow-2xl flex items-center justify-between gap-4 border-4 border-white/30">
              <div className="flex items-center gap-3"><div className="bg-white/30 rounded-full p-2"><ShoppingBasket className="h-7 w-7" /></div><span className="whitespace-nowrap">Ver Pedido</span></div>
              <div className="bg-black/15 px-4 py-2 rounded-2xl border-2 border-white/20"><span className="text-sm font-bold opacity-80 mr-2">Total:</span>R$ {total.toFixed(2)}</div>
            </Button>
          </Link>
        </div>
      )}
      {isAdmin && (
        <div className={cn("fixed right-4 md:right-8 z-40 transition-all", cartItems.length > 0 && config?.isStoreOpen ? "bottom-32" : "bottom-10")}>
          <Link href="/admin/dashboard"><Button size="icon" className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-2xl border-4 border-white"><LayoutGrid className="h-8 w-8" /></Button></Link>
        </div>
      )}
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </>
  );
}
