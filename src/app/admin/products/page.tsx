
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Pizza as PizzaIcon, 
  Loader2,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  LogOut,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Wallet,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';

export default function AdminProductsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/admin/login');
  }, [user, isUserLoading, router]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPromotion: false,
    promotionSize: 'all',
    hasMultipleSizes: false,
    priceSmall: '',
    priceMedium: '',
    priceLarge: ''
  });

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const filteredProducts = products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleLogout = async () => { await signOut(getAuth()); router.push('/admin/login'); };

  const handleSave = () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price.replace(',', '.')) || 0,
      priceSmall: formData.hasMultipleSizes ? parseFloat(formData.priceSmall.replace(',', '.')) : null,
      priceMedium: formData.hasMultipleSizes ? parseFloat(formData.priceMedium.replace(',', '.')) : null,
      priceLarge: formData.hasMultipleSizes ? parseFloat(formData.priceLarge.replace(',', '.')) : null,
    };
    if (editingProduct) updateDocumentNonBlocking(doc(firestore, 'produtos', editingProduct.id), data);
    else addDocumentNonBlocking(collection(firestore, 'produtos'), data);
    setIsDialogOpen(false);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, description: product.description, price: (product.price || 0).toString().replace('.', ','),
        categoryId: product.categoryId, imageUrl: product.imageUrl, isAvailable: product.isAvailable ?? true,
        isPromotion: product.isPromotion || false, promotionSize: product.promotionSize || 'all',
        hasMultipleSizes: product.hasMultipleSizes || false,
        priceSmall: product.priceSmall?.toString().replace('.', ',') || '',
        priceMedium: product.priceMedium?.toString().replace('.', ',') || '',
        priceLarge: product.priceLarge?.toString().replace('.', ',') || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', categoryId: '', imageUrl: '', isAvailable: true, isPromotion: false, promotionSize: 'all', hasMultipleSizes: false, priceSmall: '', priceMedium: '', priceLarge: '' });
    }
    setIsDialogOpen(true);
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

  if (isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b"><h2 className="text-2xl font-black text-primary truncate">{config?.restaurantName || "PizzApp"} Admin</h2></div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><LayoutDashboard className="mr-3 h-5 w-5 text-blue-600" /> Painel</Button></Link>
          <Link href="/admin/products"><Button variant="secondary" className="w-full justify-start rounded-xl font-bold h-12 text-black"><PizzaIcon className="mr-3 h-5 w-5 text-amber-600" /> Produtos</Button></Link>
          <Link href="/admin/categories"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Layers className="mr-3 h-5 w-5 text-emerald-600" /> Categorias</Button></Link>
          <Link href="/admin/orders"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Package className="mr-3 h-5 w-5 text-purple-600" /> Pedidos</Button></Link>
          <Link href="/admin/finance"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><Wallet className="mr-3 h-5 w-5 text-emerald-600" /> Financeiro</Button></Link>
          <Link href="/admin/payments"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><CreditCard className="mr-3 h-5 w-5 text-green-600" /> Pagamentos</Button></Link>
          <Link href="/admin/banners"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><ImageIcon className="mr-3 h-5 w-5 text-orange-500" /> Banners</Button></Link>
          <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start rounded-xl font-bold h-12 text-black hover:text-primary"><SettingsIcon className="mr-3 h-5 w-5 text-blue-600" /> Personalizar</Button></Link>
        </nav>
        <div className="p-4 border-t"><Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive rounded-xl font-bold h-12"><LogOut className="mr-3 h-5 w-5" /> Sair</Button></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div><h1 className="text-3xl font-bold">Produtos</h1><p className="text-muted-foreground">Gerencie seu cardápio</p></div>
          <Button onClick={() => handleOpenDialog()} className="rounded-full h-12 px-6 font-bold bg-primary text-white"><Plus className="mr-2 h-5 w-5" /> Novo Produto</Button>
        </div>
        <Card className="rounded-2xl border-2 mb-6 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Buscar produto..." className="pl-12 h-12 rounded-xl border-2 text-black bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isLoadingProducts ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : (
              <div className="grid gap-4">
                {filteredProducts?.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 border-2 rounded-2xl hover:bg-muted/30 transition-all bg-white">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden border shrink-0"><img src={product.imageUrl} alt="" className="object-cover w-full h-full" /></div>
                      <div className="min-w-0"><h3 className="font-black truncate text-primary">{product.name}</h3><p className="text-xs text-muted-foreground truncate">{product.description}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)} className="rounded-xl border-2"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => { if(confirm('Excluir?')) deleteDocumentNonBlocking(doc(firestore, 'produtos', product.id)); }} className="rounded-xl border-2 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader className="pt-10">
              <DialogTitle className="text-3xl font-black text-primary text-center w-full">{editingProduct ? 'Editar' : 'Novo'} Produto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2"><Label className="font-bold">Nome do Produto</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl text-black bg-white" placeholder="Ex: Pizza de Calabresa" /></div>
              <div className="grid gap-2"><Label className="font-bold">Descrição / Ingredientes</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="h-12 border-2 rounded-xl text-black bg-white" placeholder="Ex: Molho, mussarela, calabresa..." /></div>
              <div className="grid gap-2">
                <Label className="font-bold">Categoria</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger className="h-12 border-2 rounded-xl text-black bg-white"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent className="bg-white">{categories?.map(c => <SelectItem key={c.id} value={c.id} className="text-black">{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer" onClick={() => setFormData({...formData, hasMultipleSizes: !formData.hasMultipleSizes})}>
                <div className="space-y-0.5">
                  <Label className="font-bold cursor-pointer">Múltiplos Tamanhos?</Label>
                  <p className="text-xs text-muted-foreground">Ative para definir preços P, M e G</p>
                </div>
                <Switch checked={formData.hasMultipleSizes} className="pointer-events-none" />
              </div>
              {!formData.hasMultipleSizes ? (
                <div className="grid gap-2"><Label className="font-bold">Preço Único (R$)</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span><Input placeholder="0,00" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-12 pl-10 border-2 rounded-xl text-black bg-white" /></div></div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-xs font-bold">P (R$)</Label><Input value={formData.priceSmall} onChange={(e) => setFormData({...formData, priceSmall: e.target.value})} className="h-10 border-2 rounded-xl text-black bg-white" placeholder="0,00" /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">M (R$)</Label><Input value={formData.priceMedium} onChange={(e) => setFormData({...formData, priceMedium: e.target.value})} className="h-10 border-2 rounded-xl text-black bg-white" placeholder="0,00" /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">G (R$)</Label><Input value={formData.priceLarge} onChange={(e) => setFormData({...formData, priceLarge: e.target.value})} className="h-10 border-2 rounded-xl text-black bg-white" placeholder="0,00" /></div>
                </div>
              )}
              <div className="grid gap-2">
                <Label className="font-bold">Imagem do Produto</Label>
                <div className="flex gap-2">
                  <Input value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="h-12 border-2 rounded-xl text-black bg-white flex-1" placeholder="Cole o link da imagem" />
                  <Button type="button" variant="outline" className="h-12 w-12 rounded-xl border-2 p-0" onClick={() => document.getElementById('file-upload')?.click()}><ImageIcon className="h-6 w-6 text-primary" /></Button>
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                {formData.imageUrl && <div className="mt-2 relative aspect-video rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center bg-muted/10"><img src={formData.imageUrl} alt="Preview" className="object-contain w-full h-full" /></div>}
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer" onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}>
                <Label className="font-bold cursor-pointer">Disponível na Loja?</Label><Switch checked={formData.isAvailable} className="pointer-events-none" />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer" onClick={() => setFormData({...formData, isPromotion: !formData.isPromotion})}>
                <Label className="font-bold cursor-pointer">Produto em Promoção?</Label><Switch checked={formData.isPromotion} className="pointer-events-none" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave} className="w-full h-16 rounded-full text-xl font-black bg-primary text-white shadow-lg">Salvar Produto</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
