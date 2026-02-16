
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight, Pizza, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';

export default function Home() {
  const firestore = useFirestore();
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs, isLoading } = useCollection(configQuery);
  const config = configs?.[0];

  const heroPlaceholder = PlaceHolderImages.find(img => img.id === 'hero-pizza');
  const logoPlaceholder = PlaceHolderImages.find(img => img.id === 'pizzeria-logo');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const LogoIcon = config?.logoIconName && (LucideIcons as any)[config.logoIconName] 
    ? (LucideIcons as any)[config.logoIconName] 
    : LucideIcons.Pizza;

  return (
    <main className="flex-1">
      <section className="relative h-screen flex items-start md:items-center justify-center overflow-hidden pt-12 md:pt-0">
        <div className="absolute inset-0 z-0">
          <Image 
            src={config?.heroBannerImageUrl || heroPlaceholder?.imageUrl || ''} 
            alt="Hero" 
            fill 
            className="object-cover brightness-50"
            priority
            sizes="100vw"
            data-ai-hint="delicious pizza"
          />
        </div>
        
        <div className="container relative z-10 px-4 text-center space-y-8 max-w-5xl">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
            <div className="mb-8 flex flex-col items-center gap-6">
              <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-full border-4 border-primary shadow-2xl bg-white flex items-center justify-center">
                {config?.logoImageUrl ? (
                  <Image 
                    src={config.logoImageUrl} 
                    alt="Logo" 
                    fill 
                    sizes="(max-width: 768px) 128px, 192px"
                    className="object-cover"
                  />
                ) : config?.showLogoIcon ? (
                  <LogoIcon className="h-16 w-16 md:h-24 md:w-24 text-primary" />
                ) : (
                  <Image 
                    src={logoPlaceholder?.imageUrl || ''} 
                    alt="Logo" 
                    fill 
                    sizes="(max-width: 768px) 128px, 192px"
                    className="object-cover"
                  />
                )}
              </div>
              <h2 className="text-5xl md:text-8xl font-black font-headline tracking-tighter text-white drop-shadow-2xl min-h-[1.2em]">
                {config?.restaurantName || "PizzApp"}
              </h2>
            </div>

            <div className="min-h-[100px] flex flex-col items-center">
              <h1 className="text-3xl md:text-5xl font-bold text-white/90 font-headline leading-tight drop-shadow-lg max-w-3xl">
                {config?.heroBannerText || "Pizza quentinha, sabor inesquecível 🍕🔥"}
              </h1>
              <p className="text-lg md:text-2xl text-white/80 font-medium mt-4 drop-shadow-md">
                {config?.openingHoursText || "Aberto das 18h às 23h30"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 pt-6">
            <Link href="/menu">
              <Button className="rounded-full h-16 md:h-20 px-10 md:px-14 text-2xl md:text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 transform transition hover:scale-105 active:scale-95 group">
                Fazer Pedido Agora
                <ChevronRight className="ml-2 h-8 w-8 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
