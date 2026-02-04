
"use client"

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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  useUser 
} from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('createdAt', 'desc'), limit(5)), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const allOrdersQuery = useMemoFirebase(() => collection(firestore, 'pedidos'), [firestore]);

  const { data: recentOrders, isLoading: loadingOrders } = useCollection(ordersQuery);
  const { data: allProducts } = useCollection(productsQuery);
  const { data: allOrders } = useCollection(allOrdersQuery);

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const totalRevenue = allOrders?.reduce((acc, order) => acc + (order.totalAmount || 0), 0) || 0;
  const todayOrders = allOrders?.filter(order => {
    if (!order.createdAt?.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length || 0;

  const stats = [
    { title: 'Pedidos Hoje', value: todayOrders.toString(), icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Produtos Ativos', value: allProducts?.length.toString() || '0', icon: PizzaIcon, color: 'text-primary' },
    { title: 'Total Pedidos', value: allOrders?.length.toString() || '0', icon: Users, color: 'text-green-600' },
    { title: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-secondary' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary">PizzApp Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <PizzaIcon className="mr-3 h-5 w-5" /> Produtos
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Package className="mr-3 h-5 w-5" /> Pedidos
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <SettingsIcon className="mr-3 h-5 w-5" /> Ajustes
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl font-bold h-12">
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold">{user.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-2 rounded-2xl overflow-hidden">
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
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-2xl border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingOrders ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                  ) : (
                    recentOrders?.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-primary">#{order.id.slice(-4).toUpperCase()}</div>
                          <div>
                            <p className="font-bold">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">R$ {order.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                          <div className="hidden sm:block">
                            <Badge variant="secondary" className="mt-1">{order.status}</Badge>
                          </div>
                          <Link href="/admin/orders">
                            <Button variant="outline" className="rounded-xl">Ver Pedidos</Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                  {recentOrders?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">Nenhum pedido registrado ainda.</p>
                  )}
                </div>
                <Link href="/admin/orders">
                  <Button variant="link" className="w-full mt-4 text-primary font-bold">
                    Ver todos os pedidos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Gestão Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Link da Loja</p>
                  <Button variant="outline" className="w-full justify-start rounded-xl truncate" onClick={() => window.open('/', '_blank')}>
                    Abrir Cardápio Público
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Produtos</p>
                  <Link href="/admin/products">
                    <Button className="w-full rounded-xl bg-primary">Gerenciar Cardápio</Button>
                  </Link>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    PizzApp v1.0 - Conectado ao Firebase
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
