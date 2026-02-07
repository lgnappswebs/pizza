
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  Share2,
  Printer,
  ArrowLeft,
  Plus
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
import { collection, query, orderBy, doc } from 'firebase/firestore';
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
  const exportRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(today.getDate().toString());
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
      
      const matchDay = selectedDay === "Todos" || orderDate.getDate().toString() === selectedDay;
      const matchMonth = selectedMonth === "Todos" || (orderDate.getMonth() + 1).toString() === selectedMonth;
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
    const targetDate = new Date(parseInt(selectedYear), selectedMonth === "Todos" ? 0 : parseInt(selectedMonth) - 1, selectedDay === "Todos" ? 1 : parseInt(selectedDay));

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

    let text = `*RELATÓRIO FINANCEIRO - ${config?.restaurantName || 'PIZZAPP'}*\n`;
    text += `*Período:* ${periodLabel}\n`;
    text += `*Total de Pedidos:* ${reportOrders.length}\n`;
    text += `*Pedidos Entregues:* ${delivered.length}\n`;
    text += `*Faturamento Total: R$ ${total.toFixed(2)}*\n\n`;
    text += `_Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const generatePDF = async (mode: 'day' | 'month' | 'year') => {
    const prevDay = selectedDay;
    const prevMonth = selectedMonth;

    if (mode === 'month') {
      setSelectedDay("Todos");
    } else if (mode === 'year') {
      setSelectedDay("Todos");
      setSelectedMonth("Todos");
    }

    setIsGeneratingPDF(true);
    
    setTimeout(async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const element = exportRef.current;
        if (!element) return;

        const originalDisplay = element.style.display;
        element.style.display = 'block';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 850
        });

        element.style.display = originalDisplay;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const fileName = `relatorio-financeiro-${mode}-${Date.now()}.pdf`;
        pdf.save(fileName);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
      } finally {
        setIsGeneratingPDF(false);
        setSelectedDay(prevDay);
        setSelectedMonth(prevMonth);
      }
    }, 800);
  };

  const days = ["Todos", ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())];
  const months = [
    { v: "Todos", l: "Todo o Ano" },
    { v: "1", l: "Janeiro" }, { v: "2", l: "Fevereiro" }, { v: "3", l: "Março" },
    { v: "4", l: "Abril" }, { v: "5", l: "Maio" }, { v: "6", l: "Junho" },
    { v: "7", l: "Julho" }, { v: "8", l: "Agosto" }, { v: "9", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];
  const years = ["2024", "2025", "2026"];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0 print:hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary truncate">
            {config?.restaurantName || "PizzApp"} Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Painel
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <PizzaIcon className="mr-3 h-5 w-5" /> Produtos
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <Layers className="mr-3 h-5 w-5" /> Categorias
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <Package className="mr-3 h-5 w-5" /> Pedidos
            </Button>
          </Link>
          <Link href="/admin/finance">
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black">
              <Wallet className="mr-3 h-5 w-5" /> Financeiro
            </Button>
          </Link>
          <Link href="/admin/banners">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <ImageIcon className="mr-3 h-5 w-5" /> Banners
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <SettingsIcon className="mr-3 h-5 w-5" /> Personalizar App
            </Button>
          </Link>
          <div className="pt-4 border-t mt-4">
            <Link href="/menu">
              <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
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

      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 print:p-0 print:m-0 relative">
        <Link href="/admin/dashboard" className="fixed md:absolute top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95 print:hidden">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 mt-20 md:mt-16 print:hidden">
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl font-black text-foreground">Gestão Financeira</h1>
            <p className="text-muted-foreground font-medium">Relatórios detalhados de faturamento</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:flex-1 lg:justify-end">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border-2 shadow-sm w-full lg:w-auto overflow-hidden">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="flex-1 h-10 border-none font-bold px-2 focus:ring-0 text-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {days.map(d => <SelectItem key={d} value={d} className="text-black">{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">/</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-[2] h-10 border-none font-bold px-2 focus:ring-0 text-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {months.map(m => <SelectItem key={m.v} value={m.v} className="text-black">{m.l}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">/</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="flex-1 h-10 border-none font-bold px-2 focus:ring-0 text-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map(y => <SelectItem key={y} value={y} className="text-black">{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full h-11 flex-1 lg:flex-none px-6 font-black bg-primary shadow-lg shadow-primary/20 text-white transform transition hover:scale-[1.02] active:scale-95">
                  {isGeneratingPDF ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl bg-white border-2">
                <DropdownMenuLabel className="font-black text-[10px] uppercase text-muted-foreground px-2 py-1 tracking-widest">Compartilhar Texto</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleShareText('day')} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  Faturamento do Dia
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleShareText('month')} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  Faturamento do Mês
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleShareText('year')} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  Faturamento do Ano
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="font-black text-[10px] uppercase text-muted-foreground px-2 py-1 tracking-widest">Documentos em PDF</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => generatePDF('day')} disabled={isGeneratingPDF} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  PDF do Dia Selecionado
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => generatePDF('month')} disabled={isGeneratingPDF} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  PDF do Mês Selecionado
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => generatePDF('year')} disabled={isGeneratingPDF} className="h-10 rounded-xl cursor-pointer text-primary font-black">
                  PDF do Ano Selecionado
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTimeout(() => window.print(), 500)} className="h-10 rounded-xl cursor-pointer text-black font-bold">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:hidden">
          <Card className="rounded-[2rem] border-2 shadow-sm bg-emerald-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <DollarSign className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-white/80 font-black uppercase tracking-wider text-[9px]">Faturamento Hoje ({format(today, "dd/MM")})</CardDescription>
              <CardTitle className="text-2xl font-black">R$ {revenueToday.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Tempo Real</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-black uppercase tracking-wider text-[9px] text-muted-foreground">Período Selecionado</CardDescription>
              <CardTitle className="text-2xl font-black text-primary">R$ {revenueInPeriod.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                {selectedDay}/{selectedMonth === "Todos" ? "Ano" : selectedMonth}/{selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-black uppercase tracking-wider text-[9px] text-muted-foreground">Pedidos Período</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-600">{filteredOrders.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{deliveredInPeriod.length} entregues</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="font-black uppercase tracking-wider text-[9px] text-muted-foreground">Ticket Médio</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-600">R$ {averageTicket.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Média por pedido</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 print:hidden">
          <Card className="rounded-[2rem] border-2 overflow-hidden shadow-sm bg-white">
            <CardHeader className="border-b bg-muted/10 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-black text-black uppercase tracking-tight">Detalhamento de Vendas</CardTitle>
                  <CardDescription className="text-sm font-medium">Lista completa do período selecionado</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs px-4 py-1 rounded-full text-black border-2 font-black">{filteredOrders.length} PEDIDOS</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left table-fixed min-w-[600px]">
                  <thead className="bg-muted/30 text-[10px] uppercase font-black text-muted-foreground border-b tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-[100px]">Hora</th>
                      <th className="px-6 py-4">Cliente / Endereço</th>
                      <th className="px-6 py-4 w-[120px] text-center">Status</th>
                      <th className="px-6 py-4 text-right w-[150px]">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-20">
                          <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-black text-black">
                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "HH:mm") : '--:--'}
                          </p>
                          <p className="font-black text-primary text-[10px] opacity-50">#{order.id.slice(-4).toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-black text-sm leading-tight mb-1 text-black">{order.customerName}</p>
                          <p className="text-[11px] text-muted-foreground truncate opacity-80 font-medium">{order.customerAddress}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-center">
                          <Badge variant="outline" className={`text-[10px] px-3 py-0.5 uppercase font-black tracking-widest rounded-full ${
                            order.status === 'Delivered' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                            order.status === 'Cancelled' ? 'border-red-500 text-red-600 bg-red-50' : 
                            'border-amber-500 text-amber-600 bg-amber-50'
                          }`}>
                            {order.status === 'New' ? 'Novo' : 
                             order.status === 'Preparing' ? 'Preparando' : 
                             order.status === 'Out for Delivery' ? 'Entrega' : 
                             order.status === 'Delivered' ? 'Finalizado' : 
                             order.status === 'Cancelled' ? 'Cancelado' : order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-base align-top whitespace-nowrap text-black">
                          R$ {order.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!isLoading && filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-24 text-muted-foreground italic font-medium">
                          Nenhum pedido registrado nesta data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Elemento oculto para exportação */}
        <div ref={exportRef} style={{ display: 'none' }} className="p-10 bg-white">
           <div className="flex justify-between items-center mb-10 border-b-4 border-primary pb-6">
              <div>
                <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">{config?.restaurantName || "PIZZAPP"}</h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Relatório Financeiro Profissional</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase text-muted-foreground">Gerado em</p>
                <p className="font-bold">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="p-6 bg-muted/20 rounded-3xl border-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Período</p>
                <p className="text-xl font-black text-black">{selectedDay}/{selectedMonth}/{selectedYear}</p>
              </div>
              <div className="p-6 bg-muted/20 rounded-3xl border-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Pedidos</p>
                <p className="text-xl font-black text-black">{filteredOrders.length}</p>
              </div>
              <div className="p-6 bg-primary/10 rounded-3xl border-2 border-primary/20">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Faturamento Bruto</p>
                <p className="text-2xl font-black text-primary">R$ {revenueInPeriod.toFixed(2)}</p>
              </div>
           </div>

           <table className="w-full text-left">
              <thead>
                <tr className="bg-primary text-white font-black text-xs uppercase tracking-widest">
                  <th className="p-4 rounded-tl-xl">Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right rounded-tr-xl">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y border-x border-b">
                {filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td className="p-4 text-sm font-bold">{o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), "HH:mm") : '--:--'}</td>
                    <td className="p-4 text-sm font-medium">{o.customerName}</td>
                    <td className="p-4 text-[10px] font-black uppercase">{o.status}</td>
                    <td className="p-4 text-right font-black">R$ {o.totalAmount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50 print:hidden">
          <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-black min-w-[60px]">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
            <span className="text-[12px] font-black uppercase">Painel</span>
          </Link>
          <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-black min-w-[60px]">
            <Layers className="h-5 w-5 text-emerald-600" />
            <span className="text-[12px] font-black uppercase">Categorias</span>
          </Link>
          <Link href="/admin/products" className="flex flex-col items-center gap-1 text-black min-w-[60px]">
            <PizzaIcon className="h-5 w-5 text-amber-600" />
            <span className="text-[12px] font-black uppercase">Produtos</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-1 min-w-[60px] text-black">
                <Plus className="h-5 w-5 text-violet-600" />
                <span className="text-[12px] font-black uppercase">Mais</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4 bg-white border-2">
              <DropdownMenuItem asChild>
                <Link href="/admin/orders" className="flex items-center h-10 rounded-xl text-black font-bold">
                  <Package className="mr-2 h-4 w-4 text-purple-600" /> Pedidos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/finance" className="flex items-center h-10 rounded-xl text-black font-bold">
                  <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Financeiro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/banners" className="flex items-center h-10 rounded-xl text-black font-bold">
                  <ImageIcon className="mr-2 h-4 w-4 text-orange-500" /> Banners
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center h-10 rounded-xl text-black font-bold">
                  <SettingsIcon className="mr-2 h-4 w-4 text-blue-600" /> Personalizar App
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/menu" className="flex items-center h-10 rounded-xl text-primary font-black">
                  <ExternalLink className="mr-2 h-4 w-4 text-primary" /> Ver Cardápio
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </main>

      <style jsx global>{`
        @media print {
          @page { size: portrait; margin: 0; }
          body { font-size: 10pt; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          aside, nav, header { display: none !important; }
          body > div:not([style*="width: 850px"]) { display: none !important; }
          [data-radix-portal] { display: none !important; }
          div[style*="width: 850px"] { 
            display: block !important; 
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 20mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
