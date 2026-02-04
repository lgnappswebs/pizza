
"use client"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminProductsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPromotion: false,
    hasMultipleSizes: false,
    priceSmall: '',
    priceMedium: '',
    priceLarge: ''
  });

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: products, isLoading } = useCollection(productsQuery);

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const amount = (parseFloat(digits) / 100).toFixed(2);
    return amount.replace(".", ",");
  };

  const parseCurrency = (formattedValue: string) => {
    if (!formattedValue) return 0;
    const clean = formattedValue.replace(/[^\d]/g, "");
    return parseFloat(clean) / 100;
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: formatCurrency((product.price * 100).toFixed(0)),
        categoryId: product.categoryId,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        isPromotion: product.isPromotion || false,
        hasMultipleSizes: product.hasMultipleSizes || false,
        priceSmall: product.priceSmall ? formatCurrency((product.priceSmall * 100).toFixed(0)) : '',
        priceMedium: product.priceMedium ? formatCurrency((product.priceMedium * 100).toFixed(0)) : '',
        priceLarge: product.priceLarge ? formatCurrency((product.priceLarge * 100).toFixed(0)) : ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
        isAvailable: true,
        isPromotion: false,
        hasMultipleSizes: false,
        priceSmall: '',
        priceMedium: '',
        priceLarge: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...formData,
      price: parseCurrency(formData.price),
      priceSmall: formData.hasMultipleSizes ? parseCurrency(formData.priceSmall) : null,
      priceMedium: formData.hasMultipleSizes ? parseCurrency(formData.priceMedium) : null,
      priceLarge: formData.hasMultipleSizes ? parseCurrency(formData.priceLarge) : null,
    };

    if (editingProduct) {
      updateDocumentNonBlocking(doc(firestore, 'produtos', editingProduct.id), data);
    } else {
      addDocumentNonBlocking(collection(firestore, 'produtos'), data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteDocumentNonBlocking(doc(firestore, 'produtos', id));
    }
  };

  const handlePriceChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: formatCurrency(value) });
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
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
            <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
            <p className="text-muted-foreground">Adicione, edite ou remova itens do seu cardápio</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="rounded-full h-12 px-6 font-bold bg-primary">
            <Plus className="mr-2 h-5 w-5" /> Novo Produto
          </Button>
        </div>

        <Card className="rounded-2xl border-2 mb-6">
          <CardHeader className="pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar produto pelo nome..." 
                className="pl-10 h-12 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-muted">
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline">
                            {product.hasMultipleSizes ? `P: R$ ${product.priceSmall?.toFixed(2)} | M: R$ ${product.priceMedium?.toFixed(2)} | G: R$ ${product.priceLarge?.toFixed(2)}` : `R$ ${product.price?.toFixed(2)}`}
                          </Badge>
                          <Badge variant={product.isAvailable ? 'default' : 'destructive'}>
                            {product.isAvailable ? 'Disponível' : 'Indisponível'}
                          </Badge>
                          {product.isPromotion && <Badge className="bg-orange-500">Promoção</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)} className="rounded-xl">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredProducts?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum produto encontrado.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Descrição / Ingredientes</Label>
                <Input id="desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border-2 border-dashed">
                <div className="space-y-0.5">
                  <Label>Múltiplos Tamanhos</Label>
                  <p className="text-xs text-muted-foreground">Ative para definir preços P, M e G (ideal para pizzas)</p>
                </div>
                <Switch checked={formData.hasMultipleSizes} onCheckedChange={(v) => setFormData({...formData, hasMultipleSizes: v})} />
              </div>

              {!formData.hasMultipleSizes ? (
                <div className="grid gap-2">
                  <Label htmlFor="price">Preço Único (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input 
                      id="price" 
                      value={formData.price} 
                      onChange={(e) => handlePriceChange('price', e.target.value)} 
                      className="rounded-xl h-12 pl-10" 
                      placeholder="0,00"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 rounded-2xl border">
                  <div className="grid gap-2">
                    <Label htmlFor="pSmall">Preço Pequena (Broto)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input 
                        id="pSmall" 
                        value={formData.priceSmall} 
                        onChange={(e) => handlePriceChange('priceSmall', e.target.value)} 
                        className="rounded-xl h-12 pl-10" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pMedium">Preço Médio</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input 
                        id="pMedium" 
                        value={formData.priceMedium} 
                        onChange={(e) => handlePriceChange('priceMedium', e.target.value)} 
                        className="rounded-xl h-12 pl-10" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pLarge">Preço Grande</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input 
                        id="pLarge" 
                        value={formData.priceLarge} 
                        onChange={(e) => handlePriceChange('priceLarge', e.target.value)} 
                        className="rounded-xl h-12 pl-10" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="image">URL da Imagem</Label>
                <Input id="image" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="rounded-xl h-12" placeholder="https://..." />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label>Disponível na Loja</Label>
                </div>
                <Switch checked={formData.isAvailable} onCheckedChange={(v) => setFormData({...formData, isAvailable: v})} />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div className="space-y-0.5">
                  <Label>Produto em Promoção</Label>
                </div>
                <Switch checked={formData.isPromotion} onCheckedChange={(v) => setFormData({...formData, isPromotion: v})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-12 rounded-full font-bold bg-primary shadow-lg shadow-primary/20">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
          <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
            <span className="text-[12px] font-black uppercase">Painel</span>
          </Link>
          <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
            <Layers className="h-5 w-5 text-emerald-600" />
            <span className="text-[12px] font-black uppercase">Categorias</span>
          </Link>
          <Link href="/admin/products" className="flex flex-col items-center gap-1 text-primary min-w-[60px]">
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
                <Link href="/menu" target="_blank" className="flex items-center h-10 rounded-xl text-primary font-bold">
                  <ExternalLink className="mr-2 h-4 w-4 text-primary" /> Ver Cardápio
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </main>
    </div>
  );
}
