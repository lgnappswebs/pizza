
"use client"

import { 
  LayoutDashboard, 
  Pizza, 
  Package, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const stats = [
    { title: 'Pedidos Hoje', value: '24', icon: ShoppingBag, color: 'text-blue-600' },
    { title: 'Produtos Ativos', value: '18', icon: Pizza, color: 'text-primary' },
    { title: 'Novos Clientes', value: '12', icon: Users, color: 'text-green-600' },
    { title: 'Receita Prevista', value: 'R$ 1.250,00', icon: TrendingUp, color: 'text-secondary' },
  ];

  const recentOrders = [
    { id: '#1234', client: 'João Silva', total: 'R$ 85,90', status: 'Novo', time: '10 min' },
    { id: '#1233', client: 'Maria Oliveira', total: 'R$ 42,00', status: 'Em preparo', time: '25 min' },
    { id: '#1232', client: 'Carlos Santos', total: 'R$ 120,50', status: 'Saiu para entrega', time: '40 min' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
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
              <Pizza className="mr-3 h-5 w-5" /> Produtos
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Package className="mr-3 h-5 w-5" /> Pedidos
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Settings className="mr-3 h-5 w-5" /> Ajustes
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl font-bold h-12">
              <LogOut className="mr-3 h-5 w-5" /> Sair
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
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
                <p className="font-bold">Admin PizzApp</p>
                <p className="text-xs text-muted-foreground">Gerente</p>
              </div>
              <div className="h-10 w-10 bg-primary rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Grid */}
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

          {/* Recent Orders Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-2xl border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-primary">{order.id}</div>
                        <div>
                          <p className="font-bold">{order.client}</p>
                          <p className="text-xs text-muted-foreground">Há {order.time}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div className="hidden sm:block">
                          <p className="font-bold">{order.total}</p>
                          <Badge variant="secondary" className="mt-1">{order.status}</Badge>
                        </div>
                        <Button variant="outline" className="rounded-xl">Ver Detalhes</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="w-full mt-4 text-primary font-bold">
                  Ver todos os pedidos
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Configuração Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status da Loja</p>
                  <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                    <span className="font-bold">LOJA ABERTA</span>
                    <Button size="sm" variant="destructive" className="rounded-lg h-8">Fechar Agora</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Promoção em Destaque</p>
                  <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                    <p className="font-bold">Combo Família</p>
                    <p className="text-sm text-muted-foreground">Pizza GG + Refri 2L por R$ 59,90</p>
                    <Button variant="outline" className="w-full mt-3 h-8 border-secondary text-secondary-foreground hover:bg-secondary/20">Editar Promoção</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
