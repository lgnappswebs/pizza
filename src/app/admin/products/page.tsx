'use client';

import { useState, useEffect, useMemo } from 'react';
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
  CreditCard,
  FolderTree
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    if (!isUserLoading && !user) router.push('/admin/login');
  }, [user, isUserLoading, router]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '0,00',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPromotion: false,
    promotionSize: 'all',
    hasMultipleSizes: false,
    priceSmall: '0,00',
    priceMedium: '0,00',
    priceLarge: '0,00'
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

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const groupedProducts = useMemo(() => {
    if (!products || !categories) return {};
    const groups: Record<string, any[]> = {};
    
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(product => {
      const cat = categories.find(c => c.id === product.categoryId);
      const catName = cat ? `${cat.name} ${cat.subName ? `- ${cat.subName}` : ''}` : 'Sem Categoria';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });

    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, any[]>);
  }, [products, categories, searchTerm]);

  const handleLogout = async () => { await signOut(getAuth()); router.push('/admin/login'); };

  const handleSave = () => {
    const data = {
      ...formData,
      price: parseCurrency(formData.price),
      priceSmall: formData.hasMultipleSizes ? parseCurrency(formData.priceSmall) : null,
      priceMedium: formData.hasMultipleSizes ? parseCurrency(formData.priceMedium) : null,
      priceLarge: formData.hasMultipleSizes ? parseCurrency(formData.priceLarge) : null,
    };
    if (editingProduct) updateDocumentNonBlocking(doc(firestore, 'produtos', editingProduct.id), data);
    else addDocumentNonBlocking(collection(firestore, 'produtos'), data);
    setIsDialogOpen(false);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, 
        description: product.description, 
        price: formatCurrency((product.price || 0).toFixed(2).replace('.', '')),
        categoryId: product.categoryId, 
        imageUrl: product.imageUrl, 
        isAvailable: product.isAvailable ?? true,
        isPromotion: product.isPromotion || false, 
        promotionSize: product.promotionSize || 'all',
        hasMultipleSizes: product.hasMultipleSizes || false,
        priceSmall: formatCurrency((product.priceSmall || 0).toFixed(2).replace('.', '')),
        priceMedium: formatCurrency((product.priceMedium || 0).toFixed(2).replace('.', '')),
        priceLarge: formatCurrency((product.priceLarge || 0).toFixed(2).replace('.', ''))
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', description: '', price: '0,00', categoryId: '', imageUrl: '', 
        isAvailable: true, isPromotion: false, promotionSize: 'all', 
        hasMultipleSizes: false, priceSmall: '0,00', priceMedium: '0,00', priceLarge: '0,00' 
      });
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
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

      <main className="flex-1 p-4 md:p-8 pb-32 relative">
        <Link href="/admin/dashboard" className="fixed md:absolute top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 mt-20 md:mt-16">
          <div className="w-full text-center sm:text-left"><h1 className="text-3xl font-black text-black">Produtos</h1><p className="text-muted-foreground font-medium">Gerencie seu cardápio de forma ágil</p></div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto rounded-full h-14 px-8 font-black bg-primary text-white shadow-lg"><Plus className="mr-2 h-6 w-6" /> Novo Produto</Button>
        </div>
        
        <Card className="rounded-2xl border-2 mb-6 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Buscar produto..." className="pl-12 h-12 rounded-xl border-2 text-black bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-8">
            {isLoadingProducts ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : (
              Object.entries(groupedProducts).length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-4">
                  {Object.entries(groupedProducts).map(([catName, productsInCat]) => (
                    <AccordionItem key={catName} value={catName} className="border-none">
                      <AccordionTrigger className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl border-l-4 border-primary hover:no-underline hover:bg-primary/10 transition-all">
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <FolderTree className="h-4 w-4 text-primary" />
                          <h2 className="font-black text-sm uppercase tracking-wider text-primary">{catName}</h2>
                          <Badge variant="outline" className="ml-auto bg-white font-black mr-2">{productsInCat.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-2">
                        <div className="grid gap-4">
                          {productsInCat.map(product => (
                            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-2xl hover:bg-muted/30 transition-all bg-white gap-4 relative">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="h-16 w-16 relative rounded-xl overflow-hidden border shrink-0"><img src={product.imageUrl} alt="" className="object-cover w-full h-full" /></div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-black truncate text-primary text-lg">{product.name}</h3>
                                    {product.isPromotion && <Badge className="bg-secondary text-secondary-foreground text-[10px] h-5">Oferta</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground break-words leading-relaxed">{product.description}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0 self-end sm:self-auto sm:ml-4">
                                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)} className="rounded-xl border-2 h-10 w-10"><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => { if(confirm('Excluir este produto?')) deleteDocumentNonBlocking(doc(firestore, 'produtos', product.id)); }} className="rounded-xl border-2 text-destructive h-10 w-10"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic font-medium">
                  Nenhum produto encontrado.
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 border-primary/20 max-h-[90vh] overflow-y-auto bg-white">
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
                  <SelectContent className="bg-white">
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-black">
                        {c.name} {c.subName ? `- ${c.subName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div 
                className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors" 
                onClick={() => setFormData({...formData, hasMultipleSizes: !formData.hasMultipleSizes})}
              >
                <div className="space-y-0.5">
                  <Label className="font-bold cursor-pointer">Múltiplos Tamanhos?</Label>
                  <p className="text-xs text-muted-foreground">Ative para definir preços P, M e G</p>
                </div>
                <Switch checked={formData.hasMultipleSizes} className="pointer-events-none" />
              </div>
              {!formData.hasMultipleSizes ? (
                <div className="grid gap-2">
                  <Label className="font-bold">Preço Único (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                    <Input 
                      placeholder="0,00" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: formatCurrency(e.target.value)})} 
                      className="h-12 pl-10 border-2 rounded-xl text-black bg-white" 
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">P (R$)</Label>
                    <Input 
                      value={formData.priceSmall} 
                      onChange={(e) => setFormData({...formData, priceSmall: formatCurrency(e.target.value)})} 
                      className="h-10 border-2 rounded-xl text-black bg-white" 
                      placeholder="0,00" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">M (R$)</Label>
                    <Input 
                      value={formData.priceMedium} 
                      onChange={(e) => setFormData({...formData, priceMedium: formatCurrency(e.target.value)})} 
                      className="h-10 border-2 rounded-xl text-black bg-white" 
                      placeholder="0,00" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">G (R$)</Label>
                    <Input 
                      value={formData.priceLarge} 
                      onChange={(e) => setFormData({...formData, priceLarge: formatCurrency(e.target.value)})} 
                      className="h-10 border-2 rounded-xl text-black bg-white" 
                      placeholder="0,00" 
                    />
                  </div>
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
              <div 
                className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors" 
                onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
              >
                <Label className="font-bold cursor-pointer">Disponível na Loja?</Label>
                <Switch checked={formData.isAvailable} className="pointer-events-none" />
              </div>
              <div 
                className="flex items-center justify-between p-4 bg-muted/20 border-2 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors" 
                onClick={() => setFormData({...formData, isPromotion: !formData.isPromotion})}
              >
                <Label className="font-bold cursor-pointer">Produto em Promoção?</Label>
                <Switch checked={formData.isPromotion} className="pointer-events-none" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-16 rounded-full text-xl font-black bg-primary text-white shadow-lg hover:bg-primary/90 transition-all active:scale-95">
                Salvar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <Plus className="h-5 w-5 text-violet-600" />
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
    </div>
  );
}
