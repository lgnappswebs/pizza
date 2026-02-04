
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBasket, User, LogOut, UtensilsCrossed, LogIn, Settings } from 'lucide-react';
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
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  // Busca o perfil do usuário para obter o nome cadastrado
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

  // Lógica para exibir primeiro e segundo nome
  const customerName = useMemo(() => {
    const fullName = userProfile?.name || user?.displayName;
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
      }
      return parts[0];
    }
    // Fallback caso o nome ainda não tenha sido carregado ou definido
    return user?.email?.split('@')[0] || 'Cliente';
  }, [user, userProfile]);

  const handleLogout = () => {
    signOut(auth);
  };

  // Dinamicamente carrega o ícone se existir
  const LogoIcon = config?.logoIconName && (LucideIcons as any)[config.logoIconName] 
    ? (LucideIcons as any)[config.logoIconName] 
    : LucideIcons.Pizza;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-full border-2 border-primary shrink-0 flex items-center justify-center bg-white">
              {configs ? (
                config?.logoImageUrl ? (
                  <Image 
                    src={config.logoImageUrl} 
                    alt={config.restaurantName || "Logo"} 
                    fill 
                    className="object-cover"
                  />
                ) : config?.showLogoIcon ? (
                  <LogoIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                ) : (
                  <Image 
                    src={logoPlaceholder?.imageUrl || 'https://placehold.co/200x200?text=Logo'} 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                  />
                )
              ) : null}
            </div>
            <span className="text-xl md:text-2xl font-black font-headline text-primary whitespace-nowrap min-w-[50px]">
              {configs ? (
                <>
                  {config?.restaurantName || "PizzApp"} 
                  {!config?.restaurantName && <span className="text-secondary ml-1">Rápido</span>}
                </>
              ) : null}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/menu">
            <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 rounded-full text-primary">
              <UtensilsCrossed className="h-7 w-7" />
            </Button>
            <Button variant="ghost" className="hidden md:flex font-bold text-lg">Cardápio</Button>
          </Link>
          
          <Link href="/checkout">
            <Button className="relative rounded-full h-12 w-12 md:w-auto md:px-6 bg-primary hover:bg-primary/90 text-white font-bold transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
              <ShoppingBasket className="h-7 w-7 md:mr-2" />
              <span className="hidden md:inline text-lg">Pedido</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold border-2 border-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-2">
                  <User className="h-7 w-7 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuLabel className="font-bold flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Olá,</span>
                  <span className="truncate">{customerName}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex items-center h-10 rounded-xl">
                    <User className="mr-2 h-4 w-4" /> Minha Conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer flex items-center h-10 rounded-xl">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="icon" className="md:hidden h-12 w-12 rounded-full border-2 text-primary">
                <LogIn className="h-7 w-7" />
              </Button>
              <Button variant="outline" className="hidden md:flex rounded-full h-12 px-6 font-bold border-2 text-base">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
