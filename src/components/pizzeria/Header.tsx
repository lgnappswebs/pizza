"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBasket, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function Header() {
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const logo = PlaceHolderImages.find(img => img.id === 'pizzeria-logo');
  const { user } = useUser();
  const auth = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-primary">
              <Image 
                src={logo?.imageUrl || 'https://placehold.co/200x200?text=Logo'} 
                alt="PizzApp Logo" 
                fill 
                className="object-cover"
                data-ai-hint="pizza logo"
              />
            </div>
            <span className="text-xl font-bold font-headline hidden sm:inline-block text-primary">
              PizzApp <span className="text-secondary">Rápido</span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/menu">
            <Button variant="ghost" className="hidden sm:flex font-medium text-lg">Cardápio</Button>
          </Link>
          
          <Link href="/checkout">
            <Button className="relative rounded-full h-10 md:h-12 px-4 md:px-6 bg-primary hover:bg-primary/90 text-white font-bold transition-transform hover:scale-105 active:scale-95">
              <ShoppingBasket className="mr-1 md:mr-2 h-5 md:h-6 w-5 md:w-6" />
              <span className="text-sm md:text-lg">Pedido</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 md:h-6 w-5 md:w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] md:text-xs font-bold border-2 border-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 border-2">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="font-bold">
                  Olá, {user.displayName || user.email?.split('@')[0]}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/menu" className="cursor-pointer">Meu Cardápio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="rounded-full h-10 md:h-12 px-4 md:px-6 font-bold border-2">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
