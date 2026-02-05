
"use client";

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ImageIcon, 
  Loader2,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Package,
  Settings as SettingsIcon,
  LogOut,
  Layers,
  ExternalLink,
  ChevronLeft,
  Wallet,
  X,
  Type,
  AlignLeft,
  Layout,
  Link as LinkIcon,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  useUser 
} from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminBannersPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isActive: true,
    textPosition: 'center',
    bannerPosition: 'top',
    linkCategoryId: 'none'
  });

  const bannersQuery = useMemoFirebase(() => collection(firestore, 'banners'), [firestore]);
  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categorias'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  
  const { data: banners, isLoading } = useCollection(bannersQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const handleOpenDialog = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        description: banner.description || '',
        imageUrl: banner.imageUrl || '',
        isActive: banner.isActive ?? true,
        textPosition: banner.textPosition || 'center',
        bannerPosition: banner.bannerPosition || 'top',
        linkCategoryId: banner.linkCategoryId || 'none'
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        isActive: true,
        textPosition: 'center',
        bannerPosition: 'top',
        linkCategoryId: 'none'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...formData
    };

    if (editingBanner) {
      updateDocumentNonBlocking(doc(firestore, 'banners', editingBanner.id), data);
    } else {
      addDocumentNonBlocking(collection(firestore, 'banners'), data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este banner?')) {
      deleteDocumentNonBlocking(doc(firestore, 'banners', id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getTextPositionLabel = (pos: string) => {
    switch(pos) {
      case 'top-left': return 'Sup. Esquerdo';
      case 'top-center': return 'Sup. Central';
      case 'center': return 'Centralizado';
      case 'bottom-left': return 'Inf. Esquerdo';
      case 'bottom-center': return 'Inf. Central';
      default: return pos;
    }
  };

  const getBannerPositionLabel = (pos: string) => {
    switch(pos) {
      case 'top': return 'Topo';
      case 'middle': return 'Meio';
      case 'bottom': return 'Fim';
      default: return pos;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0">
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
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

      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 relative">
        <Link href="/admin/dashboard" className="absolute top-80 left-4 md:top-8 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 mb-10 text-center sm:text-left mt-96 md:mt-24">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold">Banners Promocionais</h1>
            <p className="text-muted-foreground">Gerencie as imagens e textos de destaque do cardápio</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto rounded-full h-14 px-8 font-black text-lg bg-primary shadow-lg shadow-primary/20 transform transition hover:scale-[1.02] active:scale-95">
            <Plus className="mr-2 h-6 w-6" /> Novo Banner
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            banners?.map((banner) => (
              <Card key={banner.id} className="rounded-2xl border-2 overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img src={banner.imageUrl} alt="Banner" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/20 flex flex-col p-4">
                    <div className="flex justify-between items-start">
                       <Badge variant={banner.isActive ? 'default' : 'destructive'} className="shadow-lg">
                        {banner.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {getBannerPositionLabel(banner.bannerPosition)}
                      </Badge>
                    </div>
                    <div className="mt-auto">
                      {banner.title && <p className="text-white font-bold text-sm truncate">{banner.title}</p>}
                      {banner.linkCategoryId !== 'none' && (
                        <p className="text-white/80 text-[10px] flex items-center gap-1 mt-1">
                          <LinkIcon className="h-3 w-3" /> Vinculado à categoria
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 flex justify-between items-center bg-white">
                  <div className="text-xs text-muted-foreground font-medium">
                    Texto: {getTextPositionLabel(banner.textPosition)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(banner)} className="rounded-xl h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(banner.id)} className="rounded-xl h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {!isLoading && banners?.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted" />
              <h3 className="text-xl font-bold">Nenhum banner</h3>
              <p className="text-muted-foreground">Adicione imagens para destacar suas promoções.</p>
            </div>
          )}
        </div>

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-primary">
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-lg font-bold flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" /> Título do Banner
                  </Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="rounded-xl border-2 h-12 text-lg" placeholder="Ex: Promoção de Terça" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-lg font-bold">Descrição</Label>
                  <Input id="desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl border-2 h-12 text-lg" placeholder="Ex: Ganhe um refri grátis" />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <AlignLeft className="h-5 w-5 text-primary" /> Posição do Texto
                  </Label>
                  <Select value={formData.textPosition} onValueChange={(v) => setFormData({...formData, textPosition: v})}>
                    <SelectTrigger className="rounded-xl border-2 h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left" className="text-lg">Sup. Esquerdo</SelectItem>
                      <SelectItem value="top-center" className="text-lg">Sup. Central</SelectItem>
                      <SelectItem value="center" className="text-lg">Centralizado</SelectItem>
                      <SelectItem value="bottom-left" className="text-lg">Inf. Esquerdo</SelectItem>
                      <SelectItem value="bottom-center" className="text-lg">Inf. Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" /> Posição no Menu
                  </Label>
                  <Select value={formData.bannerPosition} onValueChange={(v) => setFormData({...formData, bannerPosition: v})}>
                    <SelectTrigger className="rounded-xl border-2 h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top" className="text-lg">Topo do Cardápio</SelectItem>
                      <SelectItem value="middle" className="text-lg">Meio do Cardápio</SelectItem>
                      <SelectItem value="bottom" className="text-lg">Fim do Cardápio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-lg font-bold flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" /> Vincular à Categoria
                </Label>
                <Select value={formData.linkCategoryId} onValueChange={(v) => setFormData({...formData, linkCategoryId: v})}>
                  <SelectTrigger className="rounded-xl border-2 h-12 text-lg">
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-lg">Nenhuma (Apenas Imagem)</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-lg">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image" className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Imagem do Banner
                </Label>
                
                {formData.imageUrl && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 mb-2 bg-muted">
                    <img src={formData.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg"
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input id="image" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="rounded-xl flex-1 border-2 h-12 text-lg" placeholder="Cole a URL ou use a galeria" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="shrink-0 rounded-xl border-2 h-12 w-12"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </Button>
                  <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-2 border-dashed">
                <div className="space-y-0.5">
                  <Label className="text-lg font-bold">Exibir no App</Label>
                  <p className="text-sm text-muted-foreground">O banner aparecerá no cardápio</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} className="scale-125" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-16 rounded-full font-black text-xl bg-primary shadow-lg shadow-primary/20 transform transition active:scale-95">
                {editingBanner ? 'Salvar Alterações' : 'Criar Novo Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
