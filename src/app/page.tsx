
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/pizzeria/Header';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronRight, Pizza, Clock, Truck } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-pizza');

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImage?.imageUrl || 'https://placehold.co/1200x600?text=Pizza'} 
              alt="PizzApp Hero" 
              fill 
              className="object-cover brightness-50"
              priority
              data-ai-hint="delicious pizza"
            />
          </div>
          
          <div className="container relative z-10 px-4 text-center space-y-8 max-w-4xl">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-5xl md:text-7xl font-bold text-white font-headline leading-tight drop-shadow-lg">
                Pizza quentinha, sabor <span className="text-secondary">inesquecível</span> 🍕🔥
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium mt-6 drop-shadow-md">
                A melhor pizzaria da cidade na palma da sua mão. 
                Peça agora e receba em minutos!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Link href="/menu">
                <Button className="rounded-full h-16 px-10 text-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/40 transform transition hover:scale-105 active:scale-95 group">
                  Fazer Pedido Agora
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
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

      <footer className="py-10 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <p className="text-2xl font-bold mb-4 font-headline">PizzApp Rápido</p>
          <p className="opacity-80">© 2024 - Todos os direitos reservados</p>
          <div className="mt-4 flex justify-center gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Aberto das 18:00 às 23:30</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm">Segunda a Domingo</div>
          </div>
        </div>
      </footer>
    </>
  );
}
