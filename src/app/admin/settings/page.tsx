
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
  LogOut,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Wallet,
  ChevronLeft,
  Plus,
  X
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
    deliveryFee: '',
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

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "0,00";
    const amount = (parseFloat(digits) / 100).toFixed(2);
    return amount.replace(".", ",");
  };

  const parseCurrency = (formattedValue: string) => {
    if (!formattedValue) return 0;
    const clean = formattedValue.replace(/[^\d]/g, "");
    return parseFloat(clean) / 100;
  };

  const handlePhoneMask = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`;
    } else if (v.length > 6) {
      v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6,10)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    return v;
  };

  useEffect(() => {
    if (config) {
      setForm({
        restaurantName: config.restaurantName || '',
        showLogoIcon: config.showLogoIcon ?? true,
        logoIconName: config.logoIconName || '',
        logoImageUrl: config.logoImageUrl || '',
        whatsappNumber: handlePhoneMask(config.whatsappNumber || ''),
        deliveryFee: formatCurrency((config.deliveryFee || 0).toFixed(2).replace('.', '')),
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
      whatsappNumber: form.whatsappNumber.replace(/\D/g, ""),
      deliveryFee: parseCurrency(form.deliveryFee)
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

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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

      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32">
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
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-lg font-bold">Nome da Pizzaria</Label>
                  <Input 
                    id="restaurantName" 
                    placeholder="Ex: PizzApp Rápido"
                    value={form.restaurantName} 
                    onChange={(e) => setForm({...form, restaurantName: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
                
                <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border-2 border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-lg font-bold">Exibir Ícone no Logo</Label>
                    <p className="text-sm text-muted-foreground">Define se um ícone aparece ao lado do nome.</p>
                  </div>
                  <Switch checked={form.showLogoIcon} onCheckedChange={(v) => setForm({...form, showLogoIcon: v})} className="scale-125" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoIconName" className="text-lg font-bold flex items-center gap-2">
                    Ícone do Logo <span className="text-sm font-normal text-muted-foreground">(Nome Lucide)</span>
                  </Label>
                  <Input 
                    id="logoIconName" 
                    placeholder="Ex: Pizza, Flame, Utensils, Flame"
                    value={form.logoIconName} 
                    onChange={(e) => setForm({...form, logoIconName: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoImageUrl" className="text-lg font-bold">Logotipo da Pizzaria (URL ou Galeria)</Label>
                  
                  {form.logoImageUrl && (
                    <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-2 mb-4 bg-muted">
                      <img src={form.logoImageUrl} alt="Preview" className="object-cover w-full h-full" />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={() => setForm({...form, logoImageUrl: ''})}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input 
                      id="logoImageUrl" 
                      placeholder="Ex: https://suaimagem.com/logo.png"
                      value={form.logoImageUrl} 
                      onChange={(e) => setForm({...form, logoImageUrl: e.target.value})}
                      className="rounded-xl h-14 flex-1 border-2 text-lg"
                    />
                    <Button 
                      variant="outline" 
                      className="h-14 rounded-xl border-2 px-6"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </Button>
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange('logoImageUrl')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-lg font-bold">Número do WhatsApp para Pedidos</Label>
                  <Input 
                    id="whatsapp" 
                    placeholder="Ex: (11) 99999-9999"
                    value={form.whatsappNumber} 
                    onChange={(e) => setForm({...form, whatsappNumber: handlePhoneMask(e.target.value)})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee" className="text-lg font-bold">Taxa de Entrega (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">R$</span>
                    <Input 
                      id="fee" 
                      placeholder="Ex: 5,00"
                      value={form.deliveryFee} 
                      onChange={(e) => setForm({...form, deliveryFee: formatCurrency(e.target.value)})}
                      className="rounded-xl h-14 pl-14 border-2 text-lg"
                    />
                  </div>
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
                <Label htmlFor="hours" className="text-lg font-bold">Horário de Funcionamento (Texto)</Label>
                <Input 
                  id="hours" 
                  placeholder="Ex: Aberto das 18h às 23h30"
                  value={form.openingHoursText} 
                  onChange={(e) => setForm({...form, openingHoursText: e.target.value})}
                  className="rounded-xl h-14 border-2 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closedMessage" className="text-lg font-bold">Mensagem de "Fechado no Momento"</Label>
                <Textarea 
                  id="closedMessage" 
                  placeholder="Ex: Estamos fechados agora. Volte em breve!"
                  value={form.closedMessage} 
                  onChange={(e) => setForm({...form, closedMessage: e.target.value})}
                  className="rounded-2xl min-h-[120px] border-2 text-lg"
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
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="menuTitle" className="text-lg font-bold">Título do Cardápio</Label>
                  <Input 
                    id="menuTitle" 
                    placeholder="Ex: Nosso Cardápio"
                    value={form.menuTitle} 
                    onChange={(e) => setForm({...form, menuTitle: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuSubtitle" className="text-lg font-bold">Subtítulo do Cardápio</Label>
                  <Input 
                    id="menuSubtitle" 
                    placeholder="Ex: Escolha suas pizzas favoritas e monte seu pedido"
                    value={form.menuSubtitle} 
                    onChange={(e) => setForm({...form, menuSubtitle: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerText" className="text-lg font-bold">Texto do Banner Principal</Label>
                  <Input 
                    id="bannerText" 
                    placeholder="Ex: Pizza quentinha, sabor inesquecível 🍕🔥"
                    value={form.heroBannerText} 
                    onChange={(e) => setForm({...form, heroBannerText: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerImage" className="text-lg font-bold">Banner Principal (URL ou Galeria)</Label>
                  
                  {form.heroBannerImageUrl && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 mb-4 bg-muted">
                      <img src={form.heroBannerImageUrl} alt="Preview" className="object-cover w-full h-full" />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={() => setForm({...form, heroBannerImageUrl: ''})}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input 
                      id="bannerImage" 
                      placeholder="Ex: https://suaimagem.com/banner-pizza.jpg"
                      value={form.heroBannerImageUrl} 
                      onChange={(e) => setForm({...form, heroBannerImageUrl: e.target.value})}
                      className="rounded-xl h-14 flex-1 border-2 text-lg"
                    />
                    <Button 
                      variant="outline" 
                      className="h-14 rounded-xl border-2 px-6"
                      onClick={() => document.getElementById('banner-hero-upload')?.click()}
                    >
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </Button>
                    <input id="banner-hero-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange('heroBannerImageUrl')} />
                  </div>
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
                <Label htmlFor="addressFooter" className="text-lg font-bold">Endereço Físico (Rodapé)</Label>
                <Input 
                  id="addressFooter" 
                  placeholder="Ex: Rua das Pizzas, 123 - Centro"
                  value={form.address} 
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="rounded-xl h-14 border-2 text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-lg font-bold">Telefone de Contato (Rodapé)</Label>
                  <Input 
                    id="contactPhone" 
                    placeholder="Ex: (11) 1234-5678"
                    value={form.contactPhone} 
                    onChange={(e) => setForm({...form, contactPhone: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-lg font-bold">E-mail de Contato</Label>
                  <Input 
                    id="contactEmail" 
                    placeholder="Ex: contato@suapizzaria.com"
                    value={form.contactEmail} 
                    onChange={(e) => setForm({...form, contactEmail: e.target.value})}
                    className="rounded-xl h-14 border-2 text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waAuto" className="text-lg font-bold">Mensagem Automática do WhatsApp (Rodapé)</Label>
                <Input 
                  id="waAuto" 
                  placeholder="Ex: Olá, gostaria de tirar uma dúvida!"
                  value={form.whatsappAutoMessage} 
                  onChange={(e) => setForm({...form, whatsappAutoMessage: e.target.value})}
                  className="rounded-xl h-14 border-2 text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-lg font-bold"><Instagram className="h-5 w-5" /> Instagram URL</Label>
                  <Input placeholder="Ex: instagram.com/suapizzaria" value={form.instagramUrl} onChange={(e) => setForm({...form, instagramUrl: e.target.value})} className="rounded-xl h-14 border-2 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-lg font-bold"><Facebook className="h-5 w-5" /> Facebook URL</Label>
                  <Input placeholder="Ex: facebook.com/suapizzaria" value={form.facebookUrl} onChange={(e) => setForm({...form, facebookUrl: e.target.value})} className="rounded-xl h-14 border-2 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-lg font-bold"><Music2 className="h-5 w-5" /> TikTok URL</Label>
                  <Input placeholder="Ex: tiktok.com/@suapizzaria" value={form.tiktokUrl} onChange={(e) => setForm({...form, tiktokUrl: e.target.value})} className="rounded-xl h-14 border-2 text-lg" />
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
              Salvar Alterações
            </Button>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
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
              <Link href="/admin/finance" className="flex items-center h-10 rounded-xl">
                <Wallet className="mr-2 h-4 w-4 text-emerald-600" /> Financeiro
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/banners" className="flex items-center h-10 rounded-xl">
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
              <Link href="/menu" target="_blank" className="flex items-center h-10 rounded-xl text-primary font-bold">
                <ExternalLink className="mr-2 h-4 w-4 text-primary" /> Ver Cardápio
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
