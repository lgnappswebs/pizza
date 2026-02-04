
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
  Loader2,
  Calendar,
  Layers,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useEffect } from 'react';

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

  const { data: recentOrders, isLoading: loadingOrders } = useCollection(ordersQuery);
  const { data: allProducts } = useCollection(productsQuery);
  const { data: allOrders } = useCollection(allOrdersQuery);

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
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

  const chartData = [
    { name: 'Seg', total: 1200 },
    { name: 'Ter', total: 900 },
    { name: 'Qua', total: 1500 },
    { name: 'Qui', total: 1100 },
    { name: 'Sex', total: 2400 },
    { name: 'Sáb', total: 3200 },
    { name: 'Dom', total: 2800 },
  ];

  const stats = [
    { title: 'Pedidos Hoje', value: todayOrders.toString(), icon: ShoppingBag, color: 'text-blue-600', href: '/admin/orders' },
    { title: 'Produtos Ativos', value: allProducts?.length.toString() || '0', icon: PizzaIcon, color: 'text-primary', href: '/admin/products' },
    { title: 'Total Pedidos', value: allOrders?.length.toString() || '0', icon: Users, color: 'text-green-600', href: '/admin/orders' },
    { title: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-secondary', href: '/admin/orders' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary">PizzApp Admin</h2>
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
            <Link href="/menu" target="_blank">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-2xl border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                  <CardTitle className="text-xl font-bold">Resumo de Vendas</CardTitle>
                  <CardDescription>Desempenho da última semana</CardDescription>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 rounded-full px-4 py-1">
                  <Calendar className="h-4 w-4" /> últimos 7 dias
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border-2 border-primary/20 p-3 rounded-xl shadow-xl">
                                <p className="font-bold text-primary">{`R$ ${payload[0].value}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 5 || index === 6 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

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

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50 overflow-x-auto">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-primary min-w-[60px]">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase">Painel</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <PizzaIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Prods</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Cats</span>
        </Link>
        <Link href="/admin/orders" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Peds</span>
        </Link>
        <Link href="/admin/banners" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Banners</span>
        </Link>
        <Link href="/admin/settings" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <SettingsIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Personalizar</span>
        </Link>
      </nav>
    </div>
  );
}
