
"use client"

import { Header } from '@/components/pizzeria/Header';
import { ProductCard } from '@/components/pizzeria/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBasket, Pizza as PizzaIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function MenuPage() {
  const cartItems = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'categorias'), orderBy('order', 'asc'));
  }, [firestore]);

  const productsQuery = useMemoFirebase(() => {
    return collection(firestore, 'produtos');
  }, [firestore]);

  const { data: categories, isLoading: loadingCats } = useCollection(categoriesQuery);
  const { data: products, isLoading: loadingProds } = useCollection(productsQuery);

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
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Nosso Cardápio</h1>
            <p className="text-muted-foreground text-lg">Escolha suas pizzas favoritas e monte seu pedido</p>
          </div>

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
                      className="rounded-xl px-6 py-3 text-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.filter(p => p.categoryId === cat.id).map((product) => (
                      <ProductCard 
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        description={product.description}
                        price={product.price}
                        imageUrl={product.imageUrl}
                        category={product.categoryId}
                        isPromotion={product.isPromotion}
                      />
                    ))}
                  </div>
                  {products?.filter(p => p.categoryId === cat.id).length === 0 && (
                    <p className="text-center text-muted-foreground py-10">Nenhum produto nesta categoria.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </main>

      {cartItems.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-8 z-40">
          <Link href="/checkout">
            <Button className="w-full md:w-auto h-16 px-8 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xl font-black shadow-2xl flex items-center justify-between gap-8 transform hover:scale-105 active:scale-95 transition-all">
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
    </>
  );
}
