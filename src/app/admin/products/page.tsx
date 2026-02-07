
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
  Percent,
  X
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
        promotionSize: product.promotionSize || 'all',
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
        promotionSize: 'all',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Painel
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black">
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
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-black hover:text-primary">
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

      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 relative">
        <Link href="/admin/dashboard" className="fixed md:absolute top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-20 md:mt-16">
          <div>
            <h1 className="text-3xl font-bold text-black">Gestão de Produtos</h1>
            <p className="text-muted-foreground">Adicione, edite ou remova itens do seu cardápio</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto rounded-full h-12 px-6 font-bold bg-primary shadow-lg shadow-primary/20 transform transition hover:scale-[1.02] active:scale-95 text-white">
            <Plus className="mr-2 h-5 w-5" /> Novo Produto
          </Button>
        </div>

        <Card className="rounded-2xl border-2 mb-6 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 pb-6 border-b">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar produto pelo nome..." 
                className="pl-12 h-14 rounded-xl border-2 text-lg focus:border-primary transition-all shadow-sm text-black bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingProducts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredProducts?.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl hover:bg-muted/30 transition-all gap-4 group bg-white">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-20 w-20 relative rounded-xl overflow-hidden bg-muted border shrink-0">
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-black text-lg md:text-xl truncate text-primary">{product.name}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-1">{product.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-none">
                            {product.hasMultipleSizes 
                              ? `P: R$ ${product.priceSmall?.toFixed(2)} • M: R$ ${product.priceMedium?.toFixed(2)} • G: R$ ${product.priceLarge?.toFixed(2)}` 
                              : `R$ ${product.price?.toFixed(2)}`}
                          </Badge>
                          <div className="flex gap-2">
                            <Badge variant={product.isAvailable ? 'default' : 'destructive'} className="shadow-sm">
                              {product.isAvailable ? 'Disponível' : 'Indisponível'}
                            </Badge>
                            {product.isPromotion && <Badge className="bg-orange-500 text-white border-none animate-pulse">PROMO 🔥</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col lg:flex-row gap-2 pt-2 sm:pt-0 border-t sm:border-none">
                      <Button variant="outline" size="lg" onClick={() => handleOpenDialog(product)} className="flex-1 sm:flex-none rounded-xl h-12 px-4 border-2 text-black hover:bg-primary hover:text-white transition-colors bg-white">
                        <Edit2 className="h-5 w-5 mr-2" /> <span className="sm:hidden lg:inline">Editar</span>
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => handleDelete(product.id)} className="flex-1 sm:flex-none rounded-xl h-12 px-4 border-2 text-destructive hover:bg-destructive hover:text-white transition-colors bg-white">
                        <Trash2 className="h-5 w-5 mr-2" /> <span className="sm:hidden lg:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredProducts?.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                    <PizzaIcon className="h-16 w-16 mx-auto mb-4 text-muted opacity-20" />
                    <h3 className="text-xl font-bold opacity-60 text-black">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground">Tente buscar por outro nome ou adicione novos itens.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader className="pt-10 sm:text-center">
              <DialogTitle className="text-3xl font-black text-primary text-center w-full">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-lg font-bold text-black">Nome do Produto</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="rounded-xl border-2 h-12 text-lg text-black bg-white" 
                  placeholder="Ex: Pizza de Calabresa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-lg font-bold text-black">Descrição / Ingredientes</Label>
                <Input 
                  id="desc" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="rounded-xl border-2 h-12 text-lg text-black bg-white" 
                  placeholder="Ex: Molho de tomate, mussarela e calabresa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-lg font-bold text-black">Categoria</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger className="rounded-xl h-12 border-2 text-lg text-black bg-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-lg text-black">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-2 border-dashed">
                <div className="space-y-0.5">
                  <Label className="text-lg font-bold text-black">Múltiplos Tamanhos</Label>
                  <p className="text-sm text-muted-foreground">Ative para definir preços P, M e G (ideal para pizzas)</p>
                </div>
                <Switch checked={formData.hasMultipleSizes} onCheckedChange={(v) => setFormData({...formData, hasMultipleSizes: v})} className="scale-125" />
              </div>

              {!formData.hasMultipleSizes ? (
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-lg font-bold text-black">Preço Único (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">R$</span>
                    <Input 
                      id="price" 
                      value={formData.price} 
                      onChange={(e) => handlePriceChange('price', e.target.value)} 
                      className="rounded-xl h-12 pl-12 border-2 text-lg text-black bg-white" 
                      placeholder="0,00"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 rounded-2xl border-2">
                  <div className="grid gap-2">
                    <Label htmlFor="pSmall" className="text-base font-bold text-black">Preço Pequena (Broto)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                      <Input 
                        id="pSmall" 
                        value={formData.priceSmall} 
                        onChange={(e) => handlePriceChange('priceSmall', e.target.value)} 
                        className="rounded-xl h-12 pl-12 border-2 text-lg text-black bg-white" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pMedium" className="text-base font-bold text-black">Preço Médio</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                      <Input 
                        id="pMedium" 
                        value={formData.priceMedium} 
                        onChange={(e) => handlePriceChange('priceMedium', e.target.value)} 
                        className="rounded-xl h-12 pl-12 border-2 text-lg text-black bg-white" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pLarge" className="text-base font-bold text-black">Preço Grande</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                      <Input 
                        id="pLarge" 
                        value={formData.priceLarge} 
                        onChange={(e) => handlePriceChange('priceLarge', e.target.value)} 
                        className="rounded-xl h-12 pl-12 border-2 text-lg text-black bg-white" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="image" className="text-lg font-bold text-black">Imagem do Produto (URL ou Galeria)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="image" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                    className="rounded-xl h-12 flex-1 border-2 text-lg text-black bg-white" 
                    placeholder="https://suaimagem.com/foto.jpg" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 w-12 rounded-xl shrink-0 p-0 border-2 text-black"
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                  >
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </Button>
                  <input 
                    id="product-image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10 group">
                    <img src={formData.imageUrl} alt="Preview" className="object-contain w-full h-full" />
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-[10px] font-bold">Pré-visualização</div>
                    <button 
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                      className="absolute top-2 left-2 bg-destructive/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-2">
                <div className="space-y-0.5">
                  <Label className="text-lg font-bold text-black">Disponível na Loja</Label>
                </div>
                <Switch checked={formData.isAvailable} onCheckedChange={(v) => setFormData({...formData, isAvailable: v})} className="scale-125" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-2">
                  <div className="space-y-0.5">
                    <Label className="text-lg font-bold text-black flex items-center gap-2">
                      <Percent className="h-5 w-5 text-primary" /> Produto em Promoção
                    </Label>
                  </div>
                  <Switch checked={formData.isPromotion} onCheckedChange={(v) => setFormData({...formData, isPromotion: v})} className="scale-125" />
                </div>

                {formData.isPromotion && formData.hasMultipleSizes && (
                  <div className="grid gap-2 p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="promotionSize" className="text-base font-bold text-black">Tamanho em Promoção</Label>
                    <Select value={formData.promotionSize} onValueChange={(v) => setFormData({...formData, promotionSize: v})}>
                      <SelectTrigger className="rounded-xl h-12 border-2 text-lg text-black bg-white">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all" className="text-lg text-black">Todos os Tamanhos</SelectItem>
                        <SelectItem value="small" className="text-lg text-black">Apenas Pequena (Broto)</SelectItem>
                        <SelectItem value="medium" className="text-lg text-black">Apenas Média</SelectItem>
                        <SelectItem value="large" className="text-lg text-black">Apenas Grande</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Selecione se o desconto vale para todos ou apenas um tamanho específico.</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={handleSave} className="w-full h-16 rounded-full text-xl font-black bg-primary shadow-lg shadow-primary/20 transform transition active:scale-95 text-white">
                {editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                <Plus className="h-5 w-5 text-violet-600" />
                <span className="text-[12px] font-black uppercase">Mais</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl mb-4 bg-white">
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
                <Link href="/admin/banners" className="flex items-center h-10 rounded-xl text-black">
                  <ImageIcon className="mr-2 h-4 w-4 text-orange-500" /> Banners
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center h-10 rounded-xl text-black">
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
      </main>
    </div>
  );
}
