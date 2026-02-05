
"use client";

import { 
  LayoutDashboard, 
  Pizza as PizzaIcon, 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Bell,
  Loader2,
  Calendar,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Wallet,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  useUser,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const ordersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('createdAt', 'desc'), limit(5)), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const allOrdersQuery = useMemoFirebase(() => collection(firestore, 'pedidos'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const notificationsQuery = useMemoFirebase(() => query(collection(firestore, 'notificacoes'), orderBy('createdAt', 'desc'), limit(20)), [firestore]);

  const { data: recentOrders, isLoading: loadingOrders } = useCollection(ordersQuery);
  const { data: allProducts } = useCollection(productsQuery);
  const { data: allOrders } = useCollection(allOrdersQuery);
  const { data: configs } = useCollection(configQuery);
  const { data: notifications } = useCollection(notificationsQuery);
  
  const config = configs?.[0];
  const unreadCount = notifications?.length || 0;

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.orderId) {
      router.push('/admin/orders');
    }
    deleteDocumentNonBlocking(doc(firestore, 'notificacoes', notification.id));
  };

  const markAllAsRead = () => {
    notifications?.forEach(n => deleteDocumentNonBlocking(doc(firestore, 'notificacoes', n.id)));
  };

  const totalRevenue = allOrders?.filter(o => o.status === 'Delivered').reduce((acc, order) => acc + (order.totalAmount || 0), 0) || 0;
  const todayOrders = allOrders?.filter(order => {
    if (!order.createdAt?.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length || 0;

  const stats = [
    { title: 'Pedidos Hoje', value: todayOrders.toString(), icon: ShoppingBag, color: 'text-blue-600', href: '/admin/orders' },
    { title: 'Produtos Ativos', value: allProducts?.length.toString() || '0', icon: PizzaIcon, color: 'text-primary', href: '/admin/products' },
    { title: 'Total Pedidos', value: allOrders?.length.toString() || '0', icon: Users, color: 'text-green-600', href: '/admin/orders' },
    { title: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}`, icon: Wallet, color: 'text-secondary', href: '/admin/finance' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary truncate">
            {config?.restaurantName || "PizzApp"} Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Painel
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <PizzaIcon className="mr-3 h-5 w-5" /> Produtos
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Layers className="mr-3 h-5 w-5" /> Categorias
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Package className="mr-3 h-5 w-5" /> Pedidos
            </Button>
          </Link>
          <Link href="/admin/finance">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Wallet className="mr-3 h-5 w-5" /> Financeiro
            </Button>
          </Link>
          <Link href="/admin/banners">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <ImageIcon className="mr-3 h-5 w-5" /> Banners
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <SettingsIcon className="mr-3 h-5 w-5" /> Personalizar App
            </Button>
          </Link>
          <div className="pt-4 border-t mt-4">
            <Link href="/menu">
              <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
                <ExternalLink className="mr-3 h-5 w-5" /> Ver Cardápio
              </Button>
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl font-bold h-12">
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pb-32 md:pb-0">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full border-2">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-in zoom-in duration-300">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl overflow-hidden border-2" align="end">
                <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 font-bold" onClick={markAllAsRead}>
                      Limpar todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-80">
                  {notifications?.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="italic text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications?.map((n) => (
                        <div 
                          key={n.id} 
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group relative bg-primary/5 border-l-4 border-primary"
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-sm leading-tight">{n.title}</p>
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), "HH:mm 'de' d/MM") : 'Agora'}
                            </p>
                            <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Abrir Pedido</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold">{user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold border-2 border-primary/20">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <Link key={idx} href={stat.href}>
                <Card className="border-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-95 transform transition duration-200">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-muted/50 ${stat.color}`}>
                      <stat.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            <Card className="rounded-2xl border-2 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  {loadingOrders ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                  ) : (
                    recentOrders?.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-full">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="max-w-[120px]">
                            <p className="font-bold truncate">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">R$ {order.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{order.status}</Badge>
                      </div>
                    ))
                  )}
                  {recentOrders?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground italic">Nenhum pedido hoje.</p>
                  )}
                </div>
                <Link href="/admin/orders">
                  <Button variant="link" className="w-full mt-6 text-primary font-bold">
                    Ver todos os pedidos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-primary min-w-[60px]">
          <LayoutDashboard className="h-5 w-5 text-blue-600" />
          <span className="text-[12px] font-black uppercase">Painel</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Layers className="h-5 w-5 text-emerald-600" />
          <span className="text-[12px] font-black uppercase">Categorias</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <PizzaIcon className="h-5 w-5 text-amber-600" />
          <span className="text-[12px] font-black uppercase">Produtos</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 min-w-[60px] text-muted-foreground">
              <Plus className="h-5 w-5 text-violet-600" />
              <span className="text-[12px] font-black uppercase">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4">
            <DropdownMenuItem asChild>
              <Link href="/admin/orders" className="flex items-center h-10 rounded-xl">
                <Package className="mr-2 h-4 w-4 text-purple-600" /> Pedidos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl">
                <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <ImageIcon className="mr-2 h-4 w-4 text-orange-500" /> Banners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <SettingsIcon className="mr-2 h-4 w-4 text-blue-600" /> Personalizar App
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/menu" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <ExternalLink className="mr-2 h-4 w-4 text-primary" /> Ver Cardápio
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
