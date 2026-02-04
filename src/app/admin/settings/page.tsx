
"use client"

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Store, 
  Phone, 
  Palette, 
  Loader2,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Package,
  Clock,
  Instagram,
  Facebook,
  Music2,
  Mail,
  MapPin,
  MessageSquare,
  Eye,
  LogOut,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  Wallet,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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

export default function AdminSettingsPage() {
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
    restaurantName: '',
    showLogoIcon: true,
    logoIconName: '',
    logoImageUrl: '',
    whatsappNumber: '',
    deliveryFee: '0',
    isStoreOpen: true,
    openingHoursText: '',
    closedMessage: '',
    menuTitle: '',
    menuSubtitle: '',
    heroBannerText: '',
    heroBannerImageUrl: '',
    primaryColor: '#FF4136',
    backgroundColor: '#FFFFFF',
    appBackgroundImageUrl: '',
    address: '',
    contactPhone: '',
    whatsappAutoMessage: '',
    contactEmail: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: ''
  });

  useEffect(() => {
    if (config) {
      setForm({
        restaurantName: config.restaurantName || '',
        showLogoIcon: config.showLogoIcon ?? true,
        logoIconName: config.logoIconName || '',
        logoImageUrl: config.logoImageUrl || '',
        whatsappNumber: config.whatsappNumber || '',
        deliveryFee: config.deliveryFee?.toString() || '0',
        isStoreOpen: config.isStoreOpen ?? true,
        openingHoursText: config.openingHoursText || '',
        closedMessage: config.closedMessage || '',
        menuTitle: config.menuTitle || '',
        menuSubtitle: config.menuSubtitle || '',
        heroBannerText: config.heroBannerText || '',
        heroBannerImageUrl: config.heroBannerImageUrl || '',
        primaryColor: config.primaryColor || '#FF4136',
        backgroundColor: config.backgroundColor || '#FFFFFF',
        appBackgroundImageUrl: config.appBackgroundImageUrl || '',
        address: config.address || '',
        contactPhone: config.contactPhone || '',
        whatsappAutoMessage: config.whatsappAutoMessage || '',
        contactEmail: config.contactEmail || '',
        instagramUrl: config.instagramUrl || '',
        facebookUrl: config.facebookUrl || '',
        tiktokUrl: config.tiktokUrl || ''
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
    const data = {
      ...form,
      deliveryFee: parseFloat(form.deliveryFee) || 0
    };

    if (config?.id) {
      setDocumentNonBlocking(doc(firestore, 'configuracoes', config.id), data, { merge: true });
    } else {
      addDocumentNonBlocking(collection(firestore, 'configuracoes'), data);
    }

    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações Salvas",
        description: "As alterações foram aplicadas com sucesso."
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen">
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
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

      <main className="flex-1 p-8 overflow-y-auto pb-32">
        <Link href="/admin/dashboard" className="inline-flex items-center text-primary font-bold mb-6 hover:underline gap-1">
          <ChevronLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black whitespace-nowrap overflow-hidden text-ellipsis">Personalizar Aplicativo</h1>
          <p className="text-muted-foreground text-base md:text-lg">Personalize a identidade, regras e visual da sua pizzaria</p>
        </div>

        <div className="max-w-4xl space-y-8 pb-20">
          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader className="bg-primary/5 border-b px-8 py-6">
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <Store className="h-7 w-7 text-primary" /> Configurações Gerais
              </CardTitle>
              <CardDescription className="text-base">Altere as informações principais e a aparência do seu aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nome da Pizzaria</Label>
                  <Input 
                    id="restaurantName" 
                    value={form.restaurantName} 
                    onChange={(e) => setForm({...form, restaurantName: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-base">Exibir Ícone no Logo</Label>
                    <p className="text-xs text-muted-foreground">Define se um ícone aparece ao lado do nome.</p>
                  </div>
                  <Switch checked={form.showLogoIcon} onCheckedChange={(v) => setForm({...form, showLogoIcon: v})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logoIconName" className="flex items-center gap-1">
                    Ícone do Logo (Opcional) <span className="text-xs text-muted-foreground font-normal">(Lucide Icon Name)</span>
                  </Label>
                  <Input 
                    id="logoIconName" 
                    placeholder="Ex: Pizza, Flame, Utensils"
                    value={form.logoIconName} 
                    onChange={(e) => setForm({...form, logoIconName: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoImageUrl">Logotipo da Pizzaria (Imagem URL)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="logoImageUrl" 
                      placeholder="https://suaimagem.com/logo.png"
                      value={form.logoImageUrl} 
                      onChange={(e) => setForm({...form, logoImageUrl: e.target.value})}
                      className="rounded-xl h-12"
                    />
                    <Button variant="outline" className="h-12 rounded-xl" title="Visualizar">
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Número do WhatsApp para Pedidos</Label>
                  <Input 
                    id="whatsapp" 
                    placeholder="5511999999999"
                    value={form.whatsappNumber} 
                    onChange={(e) => setForm({...form, whatsappNumber: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Taxa de Entrega (R$)</Label>
                  <Input 
                    id="fee" 
                    type="number" 
                    step="0.01"
                    value={form.deliveryFee} 
                    onChange={(e) => setForm({...form, deliveryFee: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader className="bg-yellow-500/5 border-b px-8 py-6">
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <Clock className="h-7 w-7 text-yellow-600" /> Status da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                <div className="space-y-1">
                  <Label className="text-xl font-black text-yellow-800">Loja Aberta?</Label>
                  <p className="text-sm text-yellow-700">Marque para permitir que os clientes façam pedidos.</p>
                </div>
                <Switch 
                  className="scale-150 data-[state=checked]:bg-green-500"
                  checked={form.isStoreOpen} 
                  onCheckedChange={(v) => setForm({...form, isStoreOpen: v})} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Horário de Funcionamento (Texto)</Label>
                <Input 
                  id="hours" 
                  placeholder="Ex: Aberto das 18h às 23h30"
                  value={form.openingHoursText} 
                  onChange={(e) => setForm({...form, openingHoursText: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closedMessage">Mensagem de "Fechado no Momento"</Label>
                <Textarea 
                  id="closedMessage" 
                  placeholder="Esta mensagem aparecerá no topo do cardápio quando a loja estiver fechada."
                  value={form.closedMessage} 
                  onChange={(e) => setForm({...form, closedMessage: e.target.value})}
                  className="rounded-2xl min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader className="bg-blue-500/5 border-b px-8 py-6">
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <Palette className="h-7 w-7 text-blue-600" /> Aparência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="menuTitle">Título do Cardápio</Label>
                  <Input 
                    id="menuTitle" 
                    value={form.menuTitle} 
                    onChange={(e) => setForm({...form, menuTitle: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuSubtitle">Subtítulo do Cardápio</Label>
                  <Input 
                    id="menuSubtitle" 
                    value={form.menuSubtitle} 
                    onChange={(e) => setForm({...form, menuSubtitle: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bannerText">Texto do Banner Principal</Label>
                  <Input 
                    id="bannerText" 
                    value={form.heroBannerText} 
                    onChange={(e) => setForm({...form, heroBannerText: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerImage">Imagem do Banner Principal (URL)</Label>
                  <Input 
                    id="bannerImage" 
                    value={form.heroBannerImageUrl} 
                    onChange={(e) => setForm({...form, heroBannerImageUrl: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pColor">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input id="pColor" value={form.primaryColor} onChange={(e) => setForm({...form, primaryColor: e.target.value})} className="rounded-xl h-12 font-mono" />
                    <div className="w-12 h-12 rounded-xl border-2" style={{ backgroundColor: form.primaryColor }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input id="bgColor" value={form.backgroundColor} onChange={(e) => setForm({...form, backgroundColor: e.target.value})} className="rounded-xl h-12 font-mono" />
                    <div className="w-12 h-12 rounded-xl border-2" style={{ backgroundColor: form.backgroundColor }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgPattern">Plano de Fundo do App (URL)</Label>
                  <Input 
                    id="bgPattern" 
                    placeholder="URL de padrão ou imagem"
                    value={form.appBackgroundImageUrl} 
                    onChange={(e) => setForm({...form, appBackgroundImageUrl: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader className="bg-green-500/5 border-b px-8 py-6">
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <MessageSquare className="h-7 w-7 text-green-600" /> Contato e Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="addressFooter">Endereço Físico (Rodapé)</Label>
                <Input 
                  id="addressFooter" 
                  value={form.address} 
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone de Contato (Rodapé)</Label>
                  <Input 
                    id="contactPhone" 
                    value={form.contactPhone} 
                    onChange={(e) => setForm({...form, contactPhone: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-mail de Contato</Label>
                  <Input 
                    id="contactEmail" 
                    value={form.contactEmail} 
                    onChange={(e) => setForm({...form, contactEmail: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waAuto">Mensagem Automática do WhatsApp (Rodapé)</Label>
                <Input 
                  id="waAuto" 
                  placeholder="Ex: Olá, gostaria de tirar uma dúvida!"
                  value={form.whatsappAutoMessage} 
                  onChange={(e) => setForm({...form, whatsappAutoMessage: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Instagram className="h-4 w-4" /> Instagram URL</Label>
                  <Input value={form.instagramUrl} onChange={(e) => setForm({...form, instagramUrl: e.target.value})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Facebook className="h-4 w-4" /> Facebook URL</Label>
                  <Input value={form.facebookUrl} onChange={(e) => setForm({...form, facebookUrl: e.target.value})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Music2 className="h-4 w-4" /> TikTok URL</Label>
                  <Input value={form.tiktokUrl} onChange={(e) => setForm({...form, tiktokUrl: e.target.value})} className="rounded-xl h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-8 z-30">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full h-20 rounded-full text-2xl font-black bg-primary shadow-2xl shadow-primary/40 transform transition hover:scale-[1.02] active:scale-95"
            >
              {loading ? <Loader2 className="h-8 w-8 animate-spin mr-3" /> : <Save className="mr-3 h-8 w-8" />}
              Salvar Todas as Alterações
            </Button>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <LayoutDashboard className="h-5 w-5 text-blue-600" />
          <span className="text-[11px] font-bold uppercase">Painel</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Layers className="h-5 w-5 text-emerald-600" />
          <span className="text-[11px] font-bold uppercase">Categorias</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <PizzaIcon className="h-5 w-5 text-amber-600" />
          <span className="text-[11px] font-bold uppercase">Produtos</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 min-w-[60px] text-primary">
              <Plus className="h-5 w-5 text-violet-600" />
              <span className="text-[11px] font-black uppercase">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4">
            <DropdownMenuItem asChild>
              <Link href="/admin/orders" className="flex items-center h-10 rounded-xl">
                <Package className="mr-2 h-4 w-4" /> Pedidos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl">
                <Wallet className="mr-2 h-4 w-4" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl">
                <ImageIcon className="mr-2 h-4 w-4" /> Banners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center h-10 rounded-xl text-primary font-bold">
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
