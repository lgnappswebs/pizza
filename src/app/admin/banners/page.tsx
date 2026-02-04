
"use client"

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
  Eye,
  EyeOff,
  ChevronLeft,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    imageUrl: '',
    isActive: true
  });

  const bannersQuery = useMemoFirebase(() => collection(firestore, 'banners'), [firestore]);
  const { data: banners, isLoading } = useCollection(bannersQuery);

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
        imageUrl: banner.imageUrl,
        isActive: banner.isActive
      });
    } else {
      setEditingBanner(null);
      setFormData({
        imageUrl: '',
        isActive: true
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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Banners Promocionais</h1>
            <p className="text-muted-foreground">Gerencie as imagens de destaque do topo</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="rounded-full h-12 px-6 font-bold bg-primary">
            <Plus className="mr-2 h-5 w-5" /> Novo Banner
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
                  <div className="absolute top-4 right-4">
                    <Badge variant={banner.isActive ? 'default' : 'destructive'} className="shadow-lg">
                      {banner.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(banner)} className="rounded-xl">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(banner.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
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
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase">Painel</span>
          </Link>
          <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
            <Layers className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase">Cats</span>
          </Link>
          <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
            <PizzaIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase">Prods</span>
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
                <Link href="/admin/finance" className="flex items-center h-10 rounded-xl">
                  <Wallet className="mr-2 h-4 w-4" /> Financeiro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/banners" className="flex items-center h-10 rounded-xl text-primary font-bold">
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="image">URL da Imagem</Label>
                <Input id="image" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="rounded-xl" placeholder="https://..." />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label>Exibir no App</Label>
                  <p className="text-xs text-muted-foreground">O banner aparecerá na página inicial</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-12 rounded-full font-bold bg-primary">
                Salvar Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
