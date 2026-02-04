
"use client"

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Package,
  Settings as SettingsIcon,
  LogOut,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Wallet,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  useUser 
} from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminFinancePage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const allOrdersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: allOrders, isLoading } = useCollection(allOrdersQuery);

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  // Cálculos Financeiros
  const deliveredOrders = allOrders?.filter(o => o.status === 'Delivered') || [];
  const totalRevenue = deliveredOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  const pendingRevenue = allOrders?.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
    .reduce((acc, order) => acc + (order.totalAmount || 0), 0) || 0;
  
  const averageTicket = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  // Dados fictícios para o gráfico (em um app real, agruparíamos os pedidos por data)
  const chartData = [
    { name: 'Seg', total: 400 },
    { name: 'Ter', total: 300 },
    { name: 'Qua', total: 600 },
    { name: 'Qui', total: 800 },
    { name: 'Sex', total: 1200 },
    { name: 'Sáb', total: 1800 },
    { name: 'Dom', total: 1500 },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary">PizzApp Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
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

      <main className="flex-1 p-8 pb-32 md:pb-8">
        <Link href="/admin/dashboard" className="inline-flex items-center text-primary font-bold mb-6 hover:underline gap-1">
          <ChevronLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground">Acompanhe o faturamento e desempenho da sua pizzaria</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-3xl border-2 shadow-sm bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <DollarSign className="h-20 w-20" />
            </div>
            <CardHeader>
              <CardDescription className="text-white/80 font-bold uppercase tracking-wider">Faturamento Confirmado</CardDescription>
              <CardTitle className="text-4xl font-black">R$ {totalRevenue.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> Referente a pedidos entregues
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden relative">
            <CardHeader>
              <CardDescription className="font-bold uppercase tracking-wider">Em Aberto / Pendente</CardDescription>
              <CardTitle className="text-4xl font-black text-yellow-600">R$ {pendingRevenue.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Pedidos novos e em preparo
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden relative">
            <CardHeader>
              <CardDescription className="font-bold uppercase tracking-wider">Ticket Médio</CardDescription>
              <CardTitle className="text-4xl font-black text-blue-600">R$ {averageTicket.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Valor médio por pedido
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle>Histórico de Vendas (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 5 || index === 6 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle>Últimos Recebimentos</CardTitle>
              <CardDescription>Pedidos entregues recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  deliveredOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 flex items-center justify-center rounded-full">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold truncate max-w-[150px]">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">Pedido #{order.id.slice(-4).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary">R$ {order.totalAmount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Confirmado</p>
                      </div>
                    </div>
                  ))
                )}
                {deliveredOrders.length === 0 && (
                  <p className="text-center py-10 text-muted-foreground italic">Nenhum recebimento confirmado ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Painel</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Categorias</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <PizzaIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Produtos</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 min-w-[60px] text-primary">
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4">
            <DropdownMenuItem asChild>
              <Link href="/admin/orders" className="flex items-center h-10 rounded-xl">
                <Package className="mr-2 h-4 w-4" /> Pedidos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <Wallet className="mr-2 h-4 w-4" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl">
                <ImageIcon className="mr-2 h-4 w-4" /> Banners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center h-10 rounded-xl">
                <SettingsIcon className="mr-2 h-4 w-4" /> Personalizar App
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/menu" target="_blank" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <ExternalLink className="mr-2 h-4 w-4" /> Ver Cardápio
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
