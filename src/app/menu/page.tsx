
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
  Clock, 
  X, 
  Filter,
  Beer,
  Package,
  IceCream,
  Utensils,
  Salad,
  LayoutGrid,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSpecialties, setShowSpecialties] = useState(false);
  
  const cartItems = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const firestore = useFirestore();
  const { user } = useUser();

  const categoriesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'categorias'), orderBy('order', 'asc'));
  }, [firestore]);

  const productsQuery = useMemoFirebase(() => {
    return collection(firestore, 'produtos');
  }, [firestore]);

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
      if (!groups[cat.name]) groups[cat.name] = [];
      groups[cat.name].push(cat);
    });
    return groups;
  }, [categories]);

  const mainNames = useMemo(() => {
    if (!categories) return [];
    const names = Object.keys(groupedCategories).sort((a, b) => {
      // PRIORIDADE ABSOLUTA: "Pizzas" sempre em primeiro
      const isAPizza = a.toLowerCase() === 'pizzas';
      const isBPizza = b.toLowerCase() === 'pizzas';
      
      if (isAPizza && !isBPizza) return -1;
      if (!isAPizza && isBPizza) return 1;
      
      // Caso contrário, usa a ordem do banco
      const minA = Math.min(...groupedCategories[a].map(c => c.order));
      const minB = Math.min(...groupedCategories[b].map(c => c.order));
      return minA - minB;
    });

    return names;
  }, [groupedCategories, categories]);

  const activeBanners = useMemo(() => banners?.filter(b => b.isActive) || [], [banners]);
  
  const topBanners = activeBanners.filter(b => b.bannerPosition === 'top');
  const middleBanners = activeBanners.filter(b => b.bannerPosition === 'middle');
  const bottomBanners = activeBanners.filter(b => b.bannerPosition === 'bottom');

  useEffect(() => {
    if (mainNames.length > 0 && !activeCategory) {
      // Garante que Pizzas esteja selecionada por padrão
      const pizzaName = mainNames.find(n => n.toLowerCase() === 'pizzas');
      setActiveCategory(pizzaName || mainNames[0]);
    }
  }, [mainNames, activeCategory]);

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

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return [];

    const searchLower = searchTerm.toLowerCase();
    const searchTerms = searchLower.split(' ').filter(term => term.length > 2);

    return products.filter(p => {
      const name = p.name.toLowerCase();
      const desc = p.description.toLowerCase();
      const category = categories?.find(c => c.id === p.categoryId)?.name.toLowerCase() || '';
      const subCategory = categories?.find(c => c.id === p.categoryId)?.subName?.toLowerCase() || '';

      if (name.includes(searchLower) || desc.includes(searchLower) || category.includes(searchLower)) {
        return true;
      }

      if (searchTerms.length > 0) {
        return searchTerms.some(term => 
          name.includes(term) || desc.includes(term) || category.includes(term) || subCategory.includes(term)
        );
      }

      return false;
    });
  }, [products, searchTerm, categories]);

  const isAdmin = user && user.email === 'lgngregorio@icloud.com';

  const handleTabClick = (name: string) => {
    if (activeCategory === name) {
      setShowSpecialties(!showSpecialties);
    } else {
      setActiveCategory(name);
      setShowSpecialties(true);
      setSelectedSubId('all');
    }
  };

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

  if (loadingCats || loadingProds || loadingConfigs || loadingBanners) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <div className="container mx-auto px-4 py-8">
          
          {config && !config.isStoreOpen && (
            <Alert variant="destructive" className="mb-8 rounded-3xl border-2 bg-red-50 text-red-900 border-red-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="flex gap-4">
                <div className="bg-red-600 p-3 rounded-2xl shrink-0 h-fit">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <AlertTitle className="text-2xl font-black mb-1">Pizzaria Fechada</AlertTitle>
                  <AlertDescription className="text-lg">
                    <p className="font-semibold opacity-90">{config.closedMessage || "Estamos fechados no momento."}</p>
                    {config.openingHoursText && (
                      <div className="mt-2 inline-flex items-center gap-2 bg-red-900/10 px-3 py-1 rounded-full text-sm font-bold">
                        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                        {config.openingHoursText}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="mb-10 text-center space-y-3 min-h-[120px]">
            {!loadingConfigs && (
              <>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-primary">
                  {config?.menuTitle || "Nosso Cardápio"}
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
                  {config?.menuSubtitle || "Escolha suas pizzas favoritas e monte seu pedido"}
                </p>
              </>
            )}
          </div>

          <div className="max-w-xl mx-auto mb-12 relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <Input 
              placeholder="O que você quer saborear hoje?" 
              className="h-16 pl-14 pr-12 rounded-full border-2 border-muted-foreground/20 focus:border-primary focus:ring-0 shadow-lg text-lg font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted transition-all"
                title="Limpar busca"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Banners Superiores */}
          {topBanners.length > 0 && !searchTerm && (
            <div className="mb-12 animate-in fade-in duration-700">
              {topBanners.map(banner => (
                <MenuBanner key={banner.id} banner={banner} onBannerClick={handleBannerClick} />
              ))}
            </div>
          )}

          {searchTerm.trim() ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 p-6 rounded-3xl border-2 border-dashed border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Resultados da Busca</h2>
                    <p className="text-muted-foreground font-medium">Mostrando itens para "{searchTerm}"</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setSearchTerm('')} 
                  variant="outline" 
                  className="rounded-full border-2 font-bold px-8 h-12 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Voltar ao Cardápio
                </Button>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      imageUrl={product.imageUrl}
                      category={product.categoryId}
                      isPromotion={product.isPromotion}
                      hasMultipleSizes={product.hasMultipleSizes}
                      priceSmall={product.priceSmall}
                      priceMedium={product.priceMedium}
                      priceLarge={product.priceLarge}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                  <Search className="h-20 w-20 text-muted-foreground/20 mx-auto mb-6" />
                  <h3 className="text-3xl font-black opacity-80">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-lg font-medium">
                    Tente usar outras palavras ou procure por categorias.
                  </p>
                  <Button 
                    onClick={() => setSearchTerm('')} 
                    variant="link" 
                    className="mt-6 text-primary font-black text-xl hover:scale-105 transition-transform"
                  >
                    Ver todo o cardápio
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!mainNames || mainNames.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl border-2">
                  <PizzaIcon className="h-20 w-20 text-muted mx-auto mb-6 opacity-30 animate-pulse" />
                  <h2 className="text-3xl font-black">Cardápio em Construção</h2>
                  <p className="text-muted-foreground text-lg font-medium">Em breve, muitas delícias para você!</p>
                </div>
              ) : (
                <Tabs 
                  value={activeCategory || undefined}
                  className="w-full" 
                  onValueChange={setActiveCategory}
                >
                  <div id="menu-navigation" className="flex justify-center mb-12 overflow-x-auto pb-4 no-scrollbar">
                    <TabsList className="bg-transparent h-auto flex flex-nowrap md:flex-wrap gap-3 md:gap-4 p-1 justify-start md:justify-center border-none shadow-none">
                      {mainNames.map((name) => (
                        <TabsTrigger 
                          key={name} 
                          value={name}
                          onClick={() => handleTabClick(name)}
                          className="rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-black tracking-tight border-2 border-muted data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 flex items-center gap-2 group shadow-sm whitespace-nowrap"
                        >
                          <span className="opacity-70 group-data-[state=active]:opacity-100 transition-opacity">
                            {getCategoryIcon(name)}
                          </span>
                          {name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {mainNames.map((name) => {
                    const group = groupedCategories[name];
                    const hasSubCategories = group.some(c => c.subName) || group.length > 1;
                    
                    return (
                      <TabsContent key={name} value={name} className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none space-y-10">
                        
                        {hasSubCategories && activeCategory === name && showSpecialties && (
                          <div className="flex flex-col items-center gap-5 animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/50 rounded-full border border-muted-foreground/10">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Especialidade</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowSpecialties(false)}
                                className="h-8 rounded-full px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Ocultar Filtros
                              </Button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
                              <Button 
                                variant={selectedSubId === 'all' ? 'default' : 'outline'}
                                onClick={() => setSelectedSubId('all')}
                                className={cn(
                                  "rounded-2xl h-12 px-8 font-black transition-all border-2",
                                  selectedSubId === 'all' 
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                                    : "bg-white hover:bg-primary/5 hover:border-primary/50"
                                )}
                              >
                                Tudo
                              </Button>
                              {group.map((sub) => (
                                <Button 
                                  key={sub.id}
                                  variant={selectedSubId === sub.id ? 'default' : 'outline'}
                                  onClick={() => setSelectedSubId(sub.id)}
                                  className={cn(
                                    "rounded-2xl h-12 px-8 font-black transition-all border-2",
                                    selectedSubId === sub.id 
                                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                                      : "bg-white hover:bg-primary/5 hover:border-primary/50"
                                  )}
                                >
                                  {sub.subName || 'Geral'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Banners Intermediários */}
                        {middleBanners.length > 0 && activeCategory === name && (
                          <div className="animate-in fade-in duration-700">
                            {middleBanners.map(banner => (
                              <MenuBanner key={banner.id} banner={banner} onBannerClick={handleBannerClick} />
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                          {products?.filter(p => {
                            const pCat = categories?.find(c => c.id === p.categoryId);
                            if (!pCat) return false;
                            if (pCat.name !== name) return false;
                            if (selectedSubId !== 'all' && p.categoryId !== selectedSubId) return false;
                            return true;
                          }).map((product) => (
                            <ProductCard 
                              key={product.id}
                              id={product.id}
                              name={product.name}
                              description={product.description}
                              price={product.price}
                              imageUrl={product.imageUrl}
                              category={product.categoryId}
                              isPromotion={product.isPromotion}
                              hasMultipleSizes={product.hasMultipleSizes}
                              priceSmall={product.priceSmall}
                              priceMedium={product.priceMedium}
                              priceLarge={product.priceLarge}
                            />
                          ))}
                        </div>
                        
                        {products?.filter(p => {
                          const pCat = categories?.find(c => c.id === p.categoryId);
                          return pCat && pCat.name === name && (selectedSubId === 'all' || p.categoryId === selectedSubId);
                        }).length === 0 && (
                          <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted-foreground/20">
                             <p className="text-muted-foreground text-xl font-bold italic opacity-60">Nenhum item disponível nesta seleção.</p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </>
          )}

          {/* Banners Inferiores */}
          {bottomBanners.length > 0 && !searchTerm && (
            <div className="mt-16 animate-in fade-in duration-700">
              {bottomBanners.map(banner => (
                <MenuBanner key={banner.id} banner={banner} onBannerClick={handleBannerClick} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {cartItems.length > 0 && config?.isStoreOpen && (
        <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-12 z-40 flex justify-center md:justify-end">
          <Link href="/checkout" className="w-full max-w-md md:w-auto">
            <Button className="h-20 w-full px-10 rounded-[2.5rem] bg-secondary hover:bg-secondary/90 text-secondary-foreground text-2xl font-black shadow-2xl flex items-center justify-between gap-10 transform hover:scale-105 active:scale-95 transition-all border-4 border-white/20">
              <div className="flex items-center gap-4">
                <div className="bg-white/40 rounded-full p-3 shadow-sm">
                  <ShoppingBasket className="h-8 w-8" />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-[10px] uppercase font-black opacity-70 mb-1">Seu Carrinho</span>
                  <span>Ver Pedido</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/10 px-5 py-2 rounded-2xl">
                <span className="text-sm opacity-70">Total:</span>
                <span className="text-2xl">R$ {total.toFixed(2)}</span>
              </div>
            </Button>
          </Link>
        </div>
      )}

      {isAdmin && (
        <div className="fixed bottom-10 right-4 md:right-8 z-40">
          <Link href="/admin/dashboard">
            <Button size="icon" className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 transform hover:scale-110 active:scale-95 transition-all border-4 border-white">
              <LayoutGrid className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
