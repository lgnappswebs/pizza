
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight, Pizza, Clock, Truck } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-pizza');
  const logo = PlaceHolderImages.find(img => img.id === 'pizzeria-logo');

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImage?.imageUrl || 'https://picsum.photos/seed/pizzapp-hero/1200/600'} 
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
                    src={logo?.imageUrl || 'https://placehold.co/200x200?text=Logo'} 
                    alt="PizzApp Logo" 
                    fill 
                    className="object-cover"
                    data-ai-hint="pizza logo"
                  />
                </div>
                <h2 className="text-6xl md:text-9xl font-black font-headline tracking-tighter text-white drop-shadow-2xl">
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

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4 p-8 rounded-3xl bg-background border-2 border-primary/5 hover:border-primary/20 transition-all duration-300">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Pizza className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold">Ingredientes Frescos</h3>
                <p className="text-muted-foreground text-lg">
                  Nossas massas são artesanais e os ingredientes selecionados diariamente.
                </p>
              </div>
              <div className="space-y-4 p-8 rounded-3xl bg-background border-2 border-primary/5 hover:border-primary/20 transition-all duration-300">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Clock className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold">Entrega Veloz</h3>
                <p className="text-muted-foreground text-lg">
                  Pizza quentinha direto do forno para sua mesa em até 30 minutos.
                </p>
              </div>
              <div className="space-y-4 p-8 rounded-3xl bg-background border-2 border-primary/5 hover:border-primary/20 transition-all duration-300">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Truck className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold">Peça Fácil</h3>
                <p className="text-muted-foreground text-lg">
                  Sistema de pedidos simplificado via WhatsApp para sua comodidade.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-16 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative w-24 h-24 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl">
              <Image 
                src={logo?.imageUrl || 'https://placehold.co/200x200?text=Logo'} 
                alt="PizzApp Logo" 
                fill 
                className="object-cover"
                data-ai-hint="pizza logo"
              />
            </div>
            <h2 className="text-4xl font-black font-headline tracking-tight">
              PizzApp <span className="text-secondary">Rápido</span>
            </h2>
          </div>
          
          <nav className="flex justify-center gap-8 mb-10">
            <Link href="/menu" className="text-lg font-bold hover:text-secondary transition-colors underline-offset-4 hover:underline">Cardápio</Link>
            <Link href="/checkout" className="text-lg font-bold hover:text-secondary transition-colors underline-offset-4 hover:underline">Pedido</Link>
            <Link href="/admin/login" className="text-lg font-bold hover:text-secondary transition-colors underline-offset-4 hover:underline">Admin</Link>
          </nav>

          <p className="opacity-80 text-sm">© 2024 - Todos os direitos reservados</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div className="px-5 py-2 bg-white/10 rounded-full text-sm font-medium">Aberto das 18:00 às 23:30</div>
            <div className="px-5 py-2 bg-white/10 rounded-full text-sm font-medium">Segunda a Domingo</div>
          </div>
        </div>
      </footer>
    </>
  );
}
