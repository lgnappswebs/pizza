
"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Wallet,
  X,
  Type,
  AlignLeft,
  Layout,
  Link as LinkIcon,
  ArrowLeft,
  ArrowUpToLine,
  AlignCenterVertical,
  ArrowDownToLine,
  CreditCard
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
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';

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
  
  const { data: banners, isLoading: loadingBanners } = useCollection(bannersQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const bannersTop = useMemo(() => banners?.filter(b => b.bannerPosition === 'top') || [], [banners]);
  const bannersMiddle = useMemo(() => banners?.filter(b => b.bannerPosition === 'middle') || [], [banners]);
  const bannersBottom = useMemo(() => banners?.filter(b => b.bannerPosition === 'bottom') || [], [banners]);

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
      setFormData({ title: '', description: '', imageUrl: '', isActive: true, textPosition: 'center', bannerPosition: 'top', linkCategoryId: 'none' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const data = { ...formData };
    if (editingBanner) updateDocumentNonBlocking(doc(firestore, 'banners', editingBanner.id), data);
    else addDocumentNonBlocking(collection(firestore, 'banners'), data);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este banner?')) deleteDocumentNonBlocking(doc(firestore, 'banners', id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const renderBannerGrid = (bannersList: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bannersList.map((banner) => (
        <Card className="rounded-2xl border-2 overflow-hidden group bg-white shadow-sm" key={banner.id}>
          <div className="aspect-video relative overflow-hidden bg-muted">
            <img src={banner.imageUrl} alt="" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/20 p-4 flex flex-col">
              <Badge variant={banner.isActive ? 'default' : 'destructive'} className="w-fit">{banner.isActive ? 'Ativo' : 'Inativo'}</Badge>
              <div className="mt-auto">
                {banner.title && <p className="text-white font-bold text-sm truncate">{banner.title}</p>}
              </div>
            </div>
          </div>
          <CardContent className="p-4 flex justify-between items-center bg-white">
            <div className="text-xs text-muted-foreground font-black uppercase">Texto: {banner.textPosition}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(banner)} className="rounded-xl border-2"><Edit2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => handleDelete(banner.id)} className="rounded-xl border-2 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b"><h2 className="text-2xl font-black text-primary truncate">{config?.restaurantName || "Admin"}</h2></div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><LayoutDashboard className="mr-3 h-5 w-5 text-blue-600" /> Painel</Button></Link>
          <Link href="/admin/products"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><PizzaIcon className="mr-3 h-5 w-5 text-amber-600" /> Produtos</Button></Link>
          <Link href="/admin/categories"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Layers className="mr-3 h-5 w-5 text-emerald-600" /> Categorias</Button></Link>
          <Link href="/admin/orders"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Package className="mr-3 h-5 w-5 text-purple-600" /> Pedidos</Button></Link>
          <Link href="/admin/finance"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Wallet className="mr-3 h-5 w-5 text-emerald-600" /> Financeiro</Button></Link>
          <Link href="/admin/payments"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><CreditCard className="mr-3 h-5 w-5 text-green-600" /> Pagamentos</Button></Link>
          <Link href="/admin/banners"><Button variant="secondary" className="w-full justify-start rounded-xl font-bold h-12 text-black"><ImageIcon className="mr-3 h-5 w-5 text-orange-500" /> Banners</Button></Link>
          <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><SettingsIcon className="mr-3 h-5 w-5 text-blue-600" /> Personalizar</Button></Link>
        </nav>
        <div className="p-4 border-t"><Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive font-bold h-12"><LogOut className="mr-3 h-5 w-5" /> Sair</Button></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 mt-16">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-black">Gerir Banners</h1>
            <p className="text-muted-foreground font-medium">Organize os destaques por posições</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto rounded-full h-14 px-8 font-black bg-primary text-white">
            <Plus className="mr-2 h-6 w-6" /> Novo Banner
          </Button>
        </div>

        {loadingBanners ? <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div> : (
          <div className="space-y-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 pb-2"><ArrowUpToLine className="text-orange-500" /><h2 className="text-2xl font-black">Topo do Cardápio</h2></div>
              {bannersTop.length > 0 ? renderBannerGrid(bannersTop) : <p className="text-muted-foreground italic text-sm">Vazio.</p>}
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 pb-2"><AlignCenterVertical className="text-blue-500" /><h2 className="text-2xl font-black">Meio do Cardápio</h2></div>
              {bannersMiddle.length > 0 ? renderBannerGrid(bannersMiddle) : <p className="text-muted-foreground italic text-sm">Vazio.</p>}
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 pb-2"><ArrowDownToLine className="text-emerald-500" /><h2 className="text-2xl font-black">Fim do Cardápio</h2></div>
              {bannersBottom.length > 0 ? renderBannerGrid(bannersBottom) : <p className="text-muted-foreground italic text-sm">Vazio.</p>}
            </div>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto border-2">
            <DialogHeader className="pt-10">
              <DialogTitle className="text-3xl font-black text-primary text-center w-full">{editingBanner ? 'Editar' : 'Novo'} Banner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2"><Label className="font-bold">Título</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="rounded-xl border-2 h-12" /></div>
              <div className="grid gap-2">
                <Label className="font-bold">Posição no Menu</Label>
                <Select value={formData.bannerPosition} onValueChange={(v) => setFormData({...formData, bannerPosition: v})}>
                  <SelectTrigger className="rounded-xl border-2 h-12"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="top" className="text-black">Topo</SelectItem>
                    <SelectItem value="middle" className="text-black">Meio</SelectItem>
                    <SelectItem value="bottom" className="text-black">Fim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="font-bold">Imagem</Label>
                <div className="flex gap-2">
                  <Input value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="rounded-xl flex-1 border-2 h-12" />
                  <Button type="button" variant="outline" className="shrink-0 rounded-xl border-2 h-12 w-12" onClick={() => document.getElementById('banner-upload')?.click()}><ImageIcon className="h-6 w-6 text-primary" /></Button>
                  <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-2 border-dashed cursor-pointer" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                <Label className="font-bold cursor-pointer">Exibir no App</Label><Switch checked={formData.isActive} className="pointer-events-none" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave} className="w-full h-16 rounded-full font-black text-xl bg-primary text-white shadow-lg">Salvar Banner</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
