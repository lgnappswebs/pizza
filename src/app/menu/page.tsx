
"use client"

import { Header } from '@/components/pizzeria/Header';
import { ProductCard } from '@/components/pizzeria/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';

const CATEGORIES = [
  { id: 'tradicionais', name: 'Tradicionais' },
  { id: 'especiais', name: 'Especiais' },
  { id: 'doces', name: 'Doces' },
  { id: 'bebidas', name: 'Bebidas' },
];

const PRODUCTS = [
  { 
    id: 'p1', 
    name: 'Calabresa', 
    description: 'Molho de tomate, mussarela, calabresa fatiada e cebola.', 
    price: 35.90, 
    category: 'tradicionais',
    imageUrl: PlaceHolderImages.find(img => img.id === 'pepperoni-pizza')?.imageUrl || 'https://placehold.co/600x400?text=Pizza'
  },
  { 
    id: 'p2', 
    name: 'Mussarela', 
    description: 'Molho de tomate, mussarela e orégano.', 
    price: 32.90, 
    category: 'tradicionais',
    imageUrl: PlaceHolderImages.find(img => img.id === 'margherita-pizza')?.imageUrl || 'https://placehold.co/600x400?text=Pizza'
  },
  { 
    id: 'p3', 
    name: 'Portuguesa', 
    description: 'Presunto, ovos, cebola, ervilha, mussarela e azeitonas.', 
    price: 42.90, 
    category: 'especiais',
    isPromotion: true,
    imageUrl: PlaceHolderImages.find(img => img.id === 'pepperoni-pizza')?.imageUrl || 'https://placehold.co/600x400?text=Pizza'
  },
  { 
    id: 'p4', 
    name: 'Brigadeiro', 
    description: 'Chocolate ao leite com granulado.', 
    price: 38.90, 
    category: 'doces',
    imageUrl: PlaceHolderImages.find(img => img.id === 'sweet-pizza')?.imageUrl || 'https://placehold.co/600x400?text=Pizza'
  },
  { 
    id: 'p5', 
    name: 'Coca-Cola 2L', 
    description: 'Refrigerante gelado 2 litros.', 
    price: 12.00, 
    category: 'bebidas',
    imageUrl: PlaceHolderImages.find(img => img.id === 'soft-drink')?.imageUrl || 'https://placehold.co/600x400?text=Bebida'
  },
];

export default function MenuPage() {
  const cartItems = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());

  return (
    <>
      <Header />
      <main className="flex-1 pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Nosso Cardápio</h1>
            <p className="text-muted-foreground text-lg">Escolha suas pizzas favoritas e monte seu pedido</p>
          </div>

          <Tabs defaultValue="tradicionais" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-muted p-1 rounded-2xl h-auto flex-wrap justify-center overflow-x-auto">
                {CATEGORIES.map((cat) => (
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

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PRODUCTS.filter(p => p.category === cat.id).map((product) => (
                    <ProductCard 
                      key={product.id}
                      {...product}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      {/* Floating Cart Button for Mobile/Desktop */}
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
