
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-pizza');
  const logo = PlaceHolderImages.find(img => img.id === 'pizzeria-logo');

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-screen flex items-start md:items-center justify-center overflow-hidden pt-12 md:pt-0">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImage?.imageUrl || 'https://images.unsplash.com/photo-1693609930470-2eb935294945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxkZWxpY2lvdXMlMjBwaXp6YXxlbnwwfHx8fDE3NzAyMTA0Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080'} 
              alt="PizzApp Hero" 
              fill 
              className="object-cover brightness-50"
              priority
              data-ai-hint="delicious pizza"
            />
          </div>
          
          <div className="container relative z-10 px-4 text-center space-y-8 max-w-5xl">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
              {/* Brand Branding above the headline */}
              <div className="mb-8 flex flex-col items-center gap-6">
                <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-full border-4 border-primary shadow-2xl bg-white/10 backdrop-blur-sm">
                  <Image 
                    src={logo?.imageUrl || 'https://images.unsplash.com/photo-1769968079563-65519a9147da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwaXp6YSUyMGxvZ298ZW58MHwxfHx8MTc3MDIxMDQ3N3ww&ixlib=rb-4.1.0&q=80&w=1080'} 
                    alt="PizzApp Logo" 
                    fill 
                    className="object-cover"
                    data-ai-hint="pizza logo"
                  />
                </div>
                <h2 className="text-5xl md:text-8xl font-black font-headline tracking-tighter text-white drop-shadow-2xl">
                  PizzApp <span className="text-secondary">Rápido</span>
                </h2>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white/90 font-headline leading-tight drop-shadow-lg max-w-3xl">
                Pizza quentinha, sabor <span className="text-secondary">inesquecível</span> 🍕🔥
              </h1>
              <p className="text-lg md:text-2xl text-white/80 font-medium mt-4 drop-shadow-md">
                A melhor pizzaria da cidade na palma da sua mão.
              </p>
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
    </>
  );
}
