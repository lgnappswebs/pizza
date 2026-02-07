
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBasket, User, LogOut, UtensilsCrossed, LogIn, Pizza as PizzaIconDefault } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';
import { useMemo } from 'react';
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
  const logoPlaceholder = PlaceHolderImages.find(img => img.id === 'pizzeria-logo');
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs, isLoading: loadingConfigs } = useCollection(configQuery);
  const config = configs?.[0];

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const customerName = useMemo(() => {
    const fullName = userProfile?.name || user?.displayName;
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
      }
      return parts[0];
    }
    return user?.email?.split('@')[0] || 'Cliente';
  }, [user, userProfile]);

  const handleLogout = () => {
    signOut(auth);
  };

  const LogoIcon = config?.logoIconName && (LucideIcons as any)[config.logoIconName] 
    ? (LucideIcons as any)[config.logoIconName] 
    : PizzaIconDefault;

  if (loadingConfigs) return <header className="h-28 w-full border-b bg-background/95"></header>;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-28 flex flex-col justify-center">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between py-4 gap-4">
        
        {/* Lado Esquerdo: Logo e Título */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-full border-2 border-primary shrink-0 flex items-center justify-center bg-white shadow-lg">
              {config?.logoImageUrl ? (
                <Image 
                  src={config.logoImageUrl} 
                  alt="Logo" 
                  fill 
                  className="object-cover"
                />
              ) : config?.showLogoIcon ? (
                <LogoIcon className="h-10 w-10 md:h-12 md:w-12 text-primary" />
              ) : (
                <Image 
                  src={logoPlaceholder?.imageUrl || ''} 
                  alt="Logo" 
                  fill 
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-4xl lg:text-3xl font-black font-headline text-primary whitespace-nowrap leading-none">
                {config?.restaurantName || "PizzApp"}
              </span>
              <span className="text-sm lg:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                O Sabor Original
              </span>
            </div>
          </Link>
        </div>

        {/* Navegação: No desktop à direita, no mobile em linha dedicada abaixo */}
        <nav className="flex items-center justify-center lg:justify-end gap-6 md:gap-4 w-full lg:w-auto border-t lg:border-none border-primary/5 pt-4 lg:pt-0">
          <Link href="/menu">
            <Button variant="ghost" size="icon" className="lg:hidden h-14 w-14 rounded-full text-primary bg-white/50 border-2 border-primary/10">
              <UtensilsCrossed className="h-8 w-8" />
            </Button>
            <Button variant="ghost" className="hidden lg:flex font-black text-xl h-14 hover:bg-primary/5 rounded-2xl text-foreground">Cardápio</Button>
          </Link>
          
          <Link href="/checkout">
            <Button className="relative rounded-full h-14 w-14 lg:w-auto lg:px-8 bg-primary hover:bg-primary/90 text-white font-black transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl shadow-primary/20">
              <ShoppingBasket className="h-8 w-8 lg:h-7 lg:w-7 lg:mr-2" />
              <span className="hidden lg:inline text-xl">Pedido</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-black border-2 border-background shadow-md">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-14 w-14 border-2 border-primary/20 bg-white hover:bg-primary/5 transition-all">
                  <User className="h-8 w-8 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-2xl border-2 bg-white">
                <DropdownMenuLabel className="font-bold flex flex-col gap-1 p-4">
                  <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">Olá,</span>
                  <span className="truncate text-lg font-black text-black">{customerName}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex items-center h-12 rounded-2xl font-bold hover:bg-primary/5 text-black">
                    <User className="mr-3 h-5 w-5 text-primary" /> Minha Conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer flex items-center h-12 rounded-2xl font-bold hover:bg-destructive/5 mt-1">
                  <LogOut className="mr-3 h-5 w-5" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="icon" className="lg:hidden h-14 w-14 rounded-full border-2 text-primary bg-white">
                <LogIn className="h-8 w-8" />
              </Button>
              <Button variant="outline" className="hidden lg:flex rounded-full h-14 px-8 font-black border-2 border-primary/20 text-lg hover:bg-primary/5 bg-white text-black transition-all">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
