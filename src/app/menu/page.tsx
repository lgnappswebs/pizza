
"use client"

import { useState, useMemo } from 'react';
import { Header } from '@/components/pizzeria/Header';
import { Footer } from '@/components/pizzeria/Footer';
import { ProductCard } from '@/components/pizzeria/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBasket, Pizza as PizzaIcon, Loader2, Search, ShieldCheck, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
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

  const { data: categories, isLoading: loadingCats } = useCollection(categoriesQuery);
  const { data: products, isLoading: loadingProds } = useCollection(productsQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  // Busca aprimorada que aceita múltiplos termos e termos de linguagem natural
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

      // Busca por frase completa
      if (name.includes(searchLower) || desc.includes(searchLower) || category.includes(searchLower)) {
        return true;
      }

      // Busca por termos individuais (linguagem flexível)
      if (searchTerms.length > 0) {
        return searchTerms.some(term => 
          name.includes(term) || desc.includes(term) || category.includes(term) || subCategory.includes(term)
        );
      }

      return false;
    });
  }, [products, searchTerm, categories]);

  const isAdmin = user && user.email === 'lgngregorio@icloud.com';

  if (loadingCats || loadingProds) {
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
          
          {/* Alerta de Loja Fechada */}
          {config && !config.isStoreOpen && (
            <Alert variant="destructive" className="mb-8 rounded-2xl border-2 bg-red-50 text-red-900 border-red-200 shadow-lg">
              <Clock className="h-6 w-6 text-red-600" />
              <AlertTitle className="text-xl font-black mb-2">Pizzaria Fechada no Momento</AlertTitle>
              <AlertDescription className="text-lg">
                <p className="font-bold">{config.closedMessage || "Estamos fechados agora. Volte em breve!"}</p>
                {config.openingHoursText && (
                  <p className="mt-2 text-sm opacity-80">Horário: {config.openingHoursText}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              {config?.menuTitle || "Nosso Cardápio"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {config?.menuSubtitle || "Escolha suas pizzas favoritas e monte seu pedido"}
            </p>
          </div>

          <div className="max-w-md mx-auto mb-10 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="O que você quer comer hoje?" 
              className="h-16 pl-12 pr-12 rounded-2xl border-2 focus:ring-primary shadow-sm text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted transition-all"
                title="Limpar busca"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {searchTerm.trim() ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-dashed pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Resultados da Busca</h2>
                    <p className="text-muted-foreground">Mostrando itens para "{searchTerm}"</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setSearchTerm('')} 
                  variant="outline" 
                  className="rounded-full border-2 font-bold px-6 h-12 hover:bg-primary hover:text-white transition-all"
                >
                  <X className="mr-2 h-4 w-4" />
                  Fechar Resultados
                </Button>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
                  <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    Não encontramos nada com esse nome. Tente pesquisar por sabores, tipos de bebida ou categorias.
                  </p>
                  <Button 
                    onClick={() => setSearchTerm('')} 
                    variant="link" 
                    className="mt-4 text-primary font-bold text-lg"
                  >
                    Ver todo o cardápio
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!categories || categories.length === 0 ? (
                <div className="text-center py-20">
                  <PizzaIcon className="h-16 w-16 text-muted mx-auto mb-4" />
                  <h2 className="text-2xl font-bold">Nenhuma categoria encontrada</h2>
                  <p className="text-muted-foreground">O cardápio está sendo preparado!</p>
                </div>
              ) : (
                <Tabs defaultValue={categories[0].id} className="w-full">
                  <div className="flex justify-center mb-8">
                    <TabsList className="bg-muted p-1 rounded-2xl h-auto flex-wrap justify-center overflow-x-auto">
                      {categories.map((cat) => (
                        <TabsTrigger 
                          key={cat.id} 
                          value={cat.id}
                          className="rounded-xl px-6 py-3 text-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex flex-col items-center"
                        >
                          <span>{cat.name}</span>
                          {cat.subName && (
                            <span className="text-[10px] uppercase font-normal opacity-70 leading-none mt-0.5">
                              {cat.subName}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {categories.map((cat) => {
                    const categoryProducts = products?.filter(p => p.categoryId === cat.id);
                    return (
                      <TabsContent key={cat.id} value={cat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryProducts?.map((product) => (
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
                        {categoryProducts?.length === 0 && (
                          <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                             <p className="text-muted-foreground text-lg">Nenhum produto encontrado nesta categoria.</p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {cartItems.length > 0 && config?.isStoreOpen && (
        <div className="fixed bottom-6 left-4 md:left-8 z-40">
          <Link href="/checkout">
            <Button className="h-16 px-8 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xl font-black shadow-2xl flex items-center justify-between gap-8 transform hover:scale-105 active:scale-95 transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-white/30 rounded-full p-2">
                  <ShoppingBasket className="h-6 w-6" />
                </div>
                <span>Finalizar Pedido</span>
              </div>
              <span className="bg-black/10 px-4 py-1 rounded-full">R$ {total.toFixed(2)}</span>
            </Button>
          </Link>
        </div>
      )}

      {isAdmin && (
        <div className="fixed bottom-6 right-4 md:right-8 z-40">
          <Link href="/admin/dashboard">
            <Button size="icon" className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 transform hover:scale-110 active:scale-95 transition-all">
              <ShieldCheck className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
