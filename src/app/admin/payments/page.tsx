
"use client";

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
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
  ArrowLeft,
  Save,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  useUser 
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const [form, setForm] = useState({
    pixEnabled: true,
    pixKey: '',
    pixKeyType: 'CPF',
    cardOnDeliveryEnabled: true,
    cashOnDeliveryEnabled: true
  });

  useEffect(() => {
    if (config) {
      setForm({
        pixEnabled: config.pixEnabled ?? true,
        pixKey: config.pixKey || '',
        pixKeyType: config.pixKeyType || 'CPF',
        cardOnDeliveryEnabled: config.cardOnDeliveryEnabled ?? true,
        cashOnDeliveryEnabled: config.cashOnDeliveryEnabled ?? true
      });
    }
  }, [config]);

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const handleSave = () => {
    setLoading(true);
    const data = { ...form };

    if (config?.id) {
      setDocumentNonBlocking(doc(firestore, 'configuracoes', config.id), data, { merge: true });
    } else {
      addDocumentNonBlocking(collection(firestore, 'configuracoes'), data);
    }

    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Pagamentos Atualizados",
        description: "As opções de pagamento foram salvas com sucesso."
      });
    }, 1000);
  };

  const NavItem = ({ href, icon: Icon, label, colorClass, active = false }: any) => (
    <Link href={href}>
      <Button variant={active ? "secondary" : "ghost"} className={`w-full justify-start rounded-xl font-bold text-lg h-12 text-black ${!active && 'hover:text-primary'}`}>
        <Icon className={`mr-3 h-5 w-5 ${colorClass}`} /> {label}
      </Button>
    </Link>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary truncate">
            {config?.restaurantName || "PizzApp"} Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Painel" colorClass="text-blue-600" />
          <NavItem href="/admin/products" icon={PizzaIcon} label="Produtos" colorClass="text-amber-600" />
          <NavItem href="/admin/categories" icon={Layers} label="Categorias" colorClass="text-emerald-600" />
          <NavItem href="/admin/orders" icon={Package} label="Pedidos" colorClass="text-purple-600" />
          <NavItem href="/admin/finance" icon={Wallet} label="Financeiro" colorClass="text-emerald-600" />
          <NavItem href="/admin/payments" icon={CreditCard} label="Pagamentos" colorClass="text-green-600" active />
          <NavItem href="/admin/banners" icon={ImageIcon} label="Banners" colorClass="text-orange-500" />
          <NavItem href="/admin/settings" icon={SettingsIcon} label="Personalizar App" colorClass="text-blue-600" />
          <div className="pt-4 border-t mt-4">
            <NavItem href="/menu" icon={ExternalLink} label="Ver Cardápio" colorClass="text-primary" />
          </div>
        </nav>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 rounded-xl font-bold h-12">
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32 relative">
        <Link href="/admin/dashboard" className="fixed md:absolute top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="mb-12 text-center md:text-left mt-20 md:mt-16">
          <h1 className="text-3xl font-black text-black">Gestão de Pagamentos</h1>
          <p className="text-muted-foreground text-lg">Configure quais formas de pagamento seus clientes podem usar</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <Card className="rounded-3xl border-2 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-black">
                <QrCode className="h-7 w-7 text-primary" /> Pagamento via PIX
              </CardTitle>
              <CardDescription className="text-base font-medium">Configure o recebimento instantâneo</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-all active:scale-[0.99]"
                onClick={() => setForm({...form, pixEnabled: !form.pixEnabled})}
              >
                <div className="space-y-0.5">
                  <Label className="text-xl font-bold text-black cursor-pointer">Habilitar PIX</Label>
                  <p className="text-sm text-muted-foreground">Os clientes poderão pagar via transferência instantânea.</p>
                </div>
                <Switch checked={form.pixEnabled} className="scale-125 pointer-events-none" />
              </div>

              {form.pixEnabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-lg font-bold text-black">Tipo de Chave</Label>
                      <Select value={form.pixKeyType} onValueChange={(v) => setForm({...form, pixKeyType: v})}>
                        <SelectTrigger className="rounded-xl h-14 border-2 text-lg text-black bg-white focus:border-primary">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="CPF" className="text-black">CPF</SelectItem>
                          <SelectItem value="CNPJ" className="text-black">CNPJ</SelectItem>
                          <SelectItem value="E-mail" className="text-black">E-mail</SelectItem>
                          <SelectItem value="Telefone" className="text-black">Telefone (Celular)</SelectItem>
                          <SelectItem value="Aleatória" className="text-black">Chave Aleatória (EVP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pixKey" className="text-lg font-bold text-black">Sua Chave PIX</Label>
                      <Input 
                        id="pixKey" 
                        placeholder="Insira a chave exatamente como no banco"
                        value={form.pixKey} 
                        onChange={(e) => setForm({...form, pixKey: e.target.value})}
                        className="rounded-xl h-14 border-2 text-lg text-black bg-white focus:border-primary"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic font-medium">Estes dados serão mostrados ao cliente para facilitar o "Copia e Cola" no momento do pagamento.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-blue-500/5 border-b p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-black">
                <CreditCard className="h-7 w-7 text-blue-600" /> Pagamentos na Entrega
              </CardTitle>
              <CardDescription className="text-base font-medium">Formas de pagamento que o entregador recebe</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div 
                className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-all active:scale-[0.99]"
                onClick={() => setForm({...form, cardOnDeliveryEnabled: !form.cardOnDeliveryEnabled})}
              >
                <div className="space-y-0.5">
                  <Label className="text-xl font-bold text-black cursor-pointer">Cartão (Maquininha)</Label>
                  <p className="text-sm text-muted-foreground">O entregador levará a maquininha até o cliente.</p>
                </div>
                <Switch checked={form.cardOnDeliveryEnabled} className="scale-125 pointer-events-none" />
              </div>

              <div 
                className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-all active:scale-[0.99]"
                onClick={() => setForm({...form, cashOnDeliveryEnabled: !form.cashOnDeliveryEnabled})}
              >
                <div className="space-y-0.5">
                  <Label className="text-xl font-bold text-black cursor-pointer">Dinheiro vivo</Label>
                  <p className="text-sm text-muted-foreground">O entregador receberá o valor em espécie.</p>
                </div>
                <Switch checked={form.cashOnDeliveryEnabled} className="scale-125 pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-20 rounded-full text-2xl font-black bg-primary shadow-2xl shadow-primary/40 transform transition hover:scale-[1.02] active:scale-95 text-white"
          >
            {loading ? <Loader2 className="h-8 w-8 animate-spin mr-3" /> : <Save className="mr-3 h-8 w-8" />}
            Salvar Configurações
          </Button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
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
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-[12px] font-black uppercase">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4 bg-white border-2">
            <DropdownMenuItem asChild>
              <Link href="/admin/orders" className="flex items-center h-10 rounded-xl text-black">
                <Package className="mr-2 h-4 w-4 text-purple-600" /> Pedidos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl text-black">
                <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/payments" className="flex items-center h-10 rounded-xl text-black">
                <CreditCard className="mr-2 h-4 w-4 text-green-600" /> Pagamentos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl text-black">
                <ImageIcon className="mr-2 h-4 w-4 text-orange-500" /> Banners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center h-10 rounded-xl text-black">
                <SettingsIcon className="mr-2 h-4 w-4 text-blue-600" /> Personalizar
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
