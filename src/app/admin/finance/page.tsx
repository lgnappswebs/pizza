
"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
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
  Plus,
  Share2,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminFinancePage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(today.getDate().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());

  const allOrdersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('createdAt', 'desc')), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  
  const { data: allOrders, isLoading } = useCollection(allOrdersQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(order => {
      if (!order.createdAt?.seconds) return false;
      const orderDate = new Date(order.createdAt.seconds * 1000);
      
      const matchDay = orderDate.getDate().toString() === selectedDay;
      const matchMonth = (orderDate.getMonth() + 1).toString() === selectedMonth;
      const matchYear = orderDate.getFullYear().toString() === selectedYear;

      return matchDay && matchMonth && matchYear;
    });
  }, [allOrders, selectedDay, selectedMonth, selectedYear]);

  const deliveredInPeriod = useMemo(() => filteredOrders.filter(o => o.status === 'Delivered'), [filteredOrders]);
  const revenueInPeriod = useMemo(() => deliveredInPeriod.reduce((acc, order) => acc + (order.totalAmount || 0), 0), [deliveredInPeriod]);
  
  const revenueToday = useMemo(() => {
    if (!allOrders) return 0;
    const realToday = new Date();
    return allOrders
      .filter(o => {
        if (!o.createdAt?.seconds || o.status !== 'Delivered') return false;
        const oDate = new Date(o.createdAt.seconds * 1000);
        return isSameDay(oDate, realToday);
      })
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [allOrders]);

  const averageTicket = useMemo(() => deliveredInPeriod.length > 0 ? revenueInPeriod / deliveredInPeriod.length : 0, [deliveredInPeriod.length, revenueInPeriod]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const handleShareText = (period: 'day' | 'month' | 'year') => {
    if (!allOrders) return;
    
    let reportOrders = [];
    let periodLabel = "";
    const targetDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay));

    if (period === 'day') {
      reportOrders = allOrders.filter(o => o.createdAt?.seconds && isSameDay(new Date(o.createdAt.seconds * 1000), targetDate));
      periodLabel = format(targetDate, "dd/MM/yyyy");
    } else if (period === 'month') {
      reportOrders = allOrders.filter(o => o.createdAt?.seconds && isSameMonth(new Date(o.createdAt.seconds * 1000), targetDate));
      periodLabel = format(targetDate, "MMMM/yyyy", { locale: ptBR });
    } else {
      reportOrders = allOrders.filter(o => o.createdAt?.seconds && isSameYear(new Date(o.createdAt.seconds * 1000), targetDate));
      periodLabel = selectedYear;
    }

    const delivered = reportOrders.filter(o => o.status === 'Delivered');
    const total = delivered.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    let text = `*RELATÓRIO FINANCEIRO - ${config?.restaurantName?.toUpperCase() || 'PIZZAPP'}*\n`;
    text += `*Período:* ${periodLabel}\n`;
    text += `*Total de Pedidos:* ${reportOrders.length}\n`;
    text += `*Pedidos Entregues:* ${delivered.length}\n`;
    text += `*Faturamento Total: R$ ${total.toFixed(2)}*\n\n`;
    text += `_Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { v: "1", l: "Janeiro" }, { v: "2", l: "Fevereiro" }, { v: "3", l: "Março" },
    { v: "4", l: "Abril" }, { v: "5", l: "Maio" }, { v: "6", l: "Junho" },
    { v: "7", l: "Julho" }, { v: "8", l: "Agosto" }, { v: "9", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];
  const years = ["2024", "2025", "2026"];

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row print:bg-white">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0 print:hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary truncate">
            {config?.restaurantName || "PizzApp"} Admin
          </h2>
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

      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8">
        <Link href="/admin/dashboard" className="inline-flex items-center text-primary font-bold mb-6 hover:underline gap-1 print:hidden">
          <ChevronLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground text-sm">Relatórios detalhados de faturamento</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden w-full lg:flex-1 lg:justify-end">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border-2 shadow-sm w-full lg:w-auto">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="flex-1 h-10 border-none font-bold px-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">/</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-[2] h-10 border-none font-bold px-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">/</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="flex-1 h-10 border-none font-bold px-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full h-11 flex-1 lg:flex-none px-6 font-bold bg-primary shadow-lg shadow-primary/20">
                  <Share2 className="mr-2 h-4 w-4" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuLabel className="font-bold text-xs uppercase text-muted-foreground px-2 py-1">Compartilhar Texto</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleShareText('day')} className="h-10 rounded-xl cursor-pointer">
                  Faturamento do Dia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareText('month')} className="h-10 rounded-xl cursor-pointer">
                  Faturamento do Mês
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareText('year')} className="h-10 rounded-xl cursor-pointer">
                  Faturamento do Ano
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="font-bold text-xs uppercase text-muted-foreground px-2 py-1">Gerar PDF (Impressão)</DropdownMenuLabel>
                <DropdownMenuItem onClick={handlePrintPDF} className="h-10 rounded-xl cursor-pointer text-primary font-bold">
                  <Printer className="mr-2 h-4 w-4" /> PDF do Dia Atual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPDF} className="h-10 rounded-xl cursor-pointer text-primary font-bold">
                  <Printer className="mr-2 h-4 w-4" /> PDF do Mês Atual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPDF} className="h-10 rounded-xl cursor-pointer text-primary font-bold">
                  <Printer className="mr-2 h-4 w-4" /> PDF do Ano Atual
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-3xl border-2 shadow-sm bg-emerald-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <DollarSign className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-white/80 font-bold uppercase tracking-wider text-[9px]">Faturamento Hoje ({format(today, "dd/MM")})</CardDescription>
              <CardTitle className="text-2xl font-black">R$ {revenueToday.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] font-medium opacity-80">Atualizado em tempo real</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Período Selecionado</CardDescription>
              <CardTitle className="text-2xl font-black text-primary">R$ {revenueInPeriod.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-medium">{selectedDay}/{selectedMonth}/{selectedYear}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Pedidos Período</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-600">{filteredOrders.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-medium">{deliveredInPeriod.length} entregues</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Ticket Médio</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-600">R$ {averageTicket.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-medium">Média por pedido</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="rounded-2xl border-2 overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-muted/10 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">Detalhamento</CardTitle>
                  <CardDescription className="text-xs">Vendas no período selecionado</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] px-2">{filteredOrders.length} Itens</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-hidden">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-muted/30 text-[9px] uppercase font-bold text-muted-foreground border-b">
                    <tr>
                      <th className="px-1 py-3 w-[45px] md:w-[80px]">Hora</th>
                      <th className="px-1 py-3">Cliente</th>
                      <th className="px-1 py-3 w-[45px] md:w-[70px] text-center">Status</th>
                      <th className="px-1 py-3 text-right w-[65px] md:w-[100px]">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12">
                          <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-1 py-3 align-top">
                          <p className="text-[10px] font-bold">
                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "HH:mm") : '--:--'}
                          </p>
                          <p className="font-black text-primary text-[8px] opacity-50 hidden md:block">#{order.id.slice(-4).toUpperCase()}</p>
                        </td>
                        <td className="px-1 py-3 align-top max-w-0">
                          <p className="font-bold text-[10px] md:text-[11px] truncate leading-tight mb-0.5">{order.customerName}</p>
                          <p className="text-[8px] md:text-[9px] text-muted-foreground truncate opacity-70">{order.customerAddress}</p>
                        </td>
                        <td className="px-1 py-3 align-top text-center">
                          <Badge variant="outline" className={`text-[7px] md:text-[8px] h-3.5 md:h-4 px-1 uppercase font-black tracking-tighter ${
                            order.status === 'Delivered' ? 'border-emerald-500 text-emerald-600' : 
                            order.status === 'Cancelled' ? 'border-red-500 text-red-600' : 
                            'border-amber-500 text-amber-600'
                          }`}>
                            {order.status === 'New' ? 'Novo' : 
                             order.status === 'Preparing' ? 'Prep' : 
                             order.status === 'Out for Delivery' ? 'Ent' : 
                             order.status === 'Delivered' ? 'Ok' : 
                             order.status === 'Cancelled' ? 'X' : order.status}
                          </Badge>
                        </td>
                        <td className="px-1 py-3 text-right font-black text-[10px] md:text-[11px] align-top whitespace-nowrap">
                          R$ {order.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!isLoading && filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted-foreground text-xs italic">
                          Sem pedidos nesta data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50 print:hidden">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
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
            <button className="flex flex-col items-center gap-1 min-w-[60px] text-primary">
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
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl">
                <ImageIcon className="mr-2 h-4 w-4 text-orange-500" /> Banners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center h-10 rounded-xl">
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

      <style jsx global>{`
        @media print {
          body { font-size: 10pt; }
          .print-hidden { display: none !important; }
          main { padding: 0 !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
