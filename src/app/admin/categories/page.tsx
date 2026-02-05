"use client"

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Loader2,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Package,
  Settings as SettingsIcon,
  LogOut,
  Image as ImageIcon,
  ExternalLink,
  ArrowUpDown,
  ChevronLeft,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tags,
  FolderTree,
  ArrowLeft
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useToast } from '@/hooks/use-toast';

const MAIN_CATEGORY_SUGGESTIONS = [
  "Pizzas", "Bebidas", "Porções", "Combos", "Acompanhamentos", "Sobremesas", "Outros"
];

const CATEGORIZED_SUGGESTIONS = [
  {
    title: "Pizzas",
    items: ["Salgadas", "Doces", "Especiais", "Premium", "Tradicionais", "Veganas", "Zero Lactose", "Meio a Meio", "Broto", "Gigante", "Borda Recheada", "Promocionais"]
  },
  {
    title: "Bebidas",
    items: ["Refrigerantes", "Lata 350ml", "600ml", "Garrafa 2L", "Sucos Naturais", "Cervejas", "Vinhos", "Água Mineral", "Energéticos", "Drinks & Coquetéis", "Doses", "Chás Gelados"]
  },
  {
    title: "Porções & Entradas",
    items: ["Batata Frita", "Calabresa Acebolada", "Frango a Passarinho", "Mandioca Frita", "Pastéis Mistos", "Bolinhos Gourmet", "Tábua de Frios", "Pão de Alho", "Bruschettas", "Anéis de Cebola"]
  },
  {
    title: "Pratos & Massas",
    items: ["Lasanhas", "Espaguetes", "Nhoques", "Lanches & Burgers", "Saladas Leves", "Pratos Kids", "Grelhados", "Risotos", "Massas Artesanais"]
  },
  {
    title: "Combos & Ofertas",
    items: ["Combo Família", "Combo Galera", "Combo Casal", "Combo Individual", "Promoção do Dia", "Mais Vendidos", "Almoço Executivo", "Happy Hour"]
  },
  {
    title: "Sobremesas",
    items: ["Pizzas Doces", "Petit Gâteau", "Brownie", "Pudim", "Sorvetes", "Milk Shakes", "Açaí", "Mousses", "Tortas Fatiadas"]
  }
];

export default function AdminCategoriesPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isMainSuggestionsOpen, setIsMainSuggestionsOpen] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const [formData, setFormData] = useState({
    name: '',
    subName: '',
    order: '0'
  });

  const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categorias'), orderBy('order', 'asc')), [firestore]);
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        subName: category.subName || '',
        order: category.order.toString()
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        subName: '',
        order: (categories?.length || 0).toString()
      });
    }
    setIsDialogOpen(true);
    setIsSuggestionsOpen(false);
    setIsMainSuggestionsOpen(false);
  };

  const handleSave = () => {
    const data = {
      name: formData.name,
      subName: formData.subName,
      order: parseInt(formData.order) || 0
    };

    if (editingCategory) {
      updateDocumentNonBlocking(doc(firestore, 'categorias', editingCategory.id), data);
      toast({ title: "Categoria atualizada!", description: "As mudanças foram salvas." });
    } else {
      addDocumentNonBlocking(collection(firestore, 'categorias'), data);
      toast({ title: "Categoria criada!", description: "Nova categoria adicionada ao cardápio." });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteDocumentNonBlocking(doc(firestore, 'categorias', categoryToDelete.id));
      toast({
        title: "Categoria excluída",
        description: `A categoria "${categoryToDelete.name}" foi removida.`,
        variant: "destructive"
      });
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const addNameSuggestion = (suggestion: string) => {
    setFormData({ ...formData, name: suggestion });
    setIsMainSuggestionsOpen(false);
  };

  const addSubSuggestion = (suggestion: string) => {
    setFormData({ ...formData, subName: suggestion });
    setIsSuggestionsOpen(false);
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
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

      <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8">
        <Link href="/admin/dashboard" className="fixed top-80 left-4 md:top-8 md:left-72 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-96 md:mt-24">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Categorias</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gerencie os Grupos Principais e Subcategorias</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto rounded-full h-12 px-6 font-bold bg-primary shadow-lg shadow-primary/20 transform transition hover:scale-[1.02] active:scale-95">
            <Plus className="mr-2 h-5 w-5" /> Nova Categoria
          </Button>
        </div>

        <Card className="rounded-2xl border-2">
          <CardContent className="p-3 md:p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {categories?.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 md:p-4 border rounded-2xl hover:bg-muted/30 transition-colors gap-2">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 text-sm md:text-base">
                        {category.order}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-black text-muted-foreground/60 hidden sm:inline">Grupo:</span>
                            <p className="font-black text-base md:text-lg truncate text-primary">{category.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-black text-muted-foreground/60 hidden sm:inline">Sub:</span>
                            <Badge variant="secondary" className="text-[10px] md:text-xs font-bold truncate max-w-[150px] bg-muted">
                              {category.subName || 'Geral'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 md:gap-2 shrink-0">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(category)} className="rounded-xl h-8 w-8 md:h-10 md:w-10">
                        <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDeleteClick(category)} 
                        className="rounded-xl h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {categories?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm md:text-base">
                    Nenhuma categoria encontrada.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-primary">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-3">
                <Label htmlFor="name" className="text-lg font-bold flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-primary" /> Grupo Principal
                </Label>
                <p className="text-xs text-muted-foreground -mt-2">Define o grupo no cardápio (ex: Pizzas, Bebidas, Sobremesas)</p>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="rounded-xl border-2 h-12 text-lg" placeholder="Ex: Pizzas" />
                
                <div className="space-y-2 mt-1">
                  <Collapsible open={isMainSuggestionsOpen} onOpenChange={setIsMainSuggestionsOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10 px-1">
                        <Sparkles className="h-4 w-4" />
                        {isMainSuggestionsOpen ? 'Esconder Grupos' : 'Ver Grupos Sugeridos'}
                        {isMainSuggestionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border-2 border-dashed">
                        {MAIN_CATEGORY_SUGGESTIONS.map((suggestion) => (
                          <Badge 
                            key={suggestion} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-4 rounded-full text-xs font-bold border-2 border-muted"
                            onClick={() => addNameSuggestion(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
              
              <div className="grid gap-2 border-t pt-4">
                <Label htmlFor="subName" className="text-lg font-bold flex items-center gap-2">
                  <Tags className="h-5 w-5 text-primary" /> Subcategoria / Variação
                </Label>
                <p className="text-xs text-muted-foreground -mt-1">Diferencia os tipos dentro do grupo (ex: Salgadas, Doces, Sucos)</p>
                <Input id="subName" value={formData.subName} onChange={(e) => setFormData({...formData, subName: e.target.value})} className="rounded-xl border-2 h-12 text-lg" placeholder="Ex: Salgadas" />
                
                <Collapsible open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} className="w-full mt-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10">
                      <Sparkles className="h-4 w-4" />
                      {isSuggestionsOpen ? 'Esconder Ideias' : 'Ver Ideias de Subcategorias'}
                      {isSuggestionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                      {CATEGORIZED_SUGGESTIONS.map((group) => (
                        <div key={group.title} className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">{group.title}</p>
                          <div className="flex flex-wrap gap-2">
                            {group.items.map((suggestion) => (
                              <Badge 
                                key={suggestion} 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-3 rounded-full text-[11px]"
                                onClick={() => addSubSuggestion(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="grid gap-2 border-t pt-4">
                <Label htmlFor="order" className="text-lg font-bold">Ordem de Exibição</Label>
                <div className="flex items-center gap-2">
                   <ArrowUpDown className="h-6 w-6 text-muted-foreground" />
                   <Input id="order" type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="rounded-xl border-2 h-12 text-lg" />
                </div>
                <p className="text-sm text-muted-foreground">Define a posição no menu (0 é o primeiro).</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-16 rounded-full text-xl font-black bg-primary shadow-lg transform transition active:scale-95">
                {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="rounded-3xl border-2">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-destructive">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-lg">
                Tem certeza que deseja excluir a categoria <strong>"{categoryToDelete?.name} - {categoryToDelete?.subName || 'Geral'}"</strong>? 
                Esta ação não pode ser desfeita e pode afetar a exibição de produtos vinculados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-full h-12 font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-full h-12 font-bold bg-destructive hover:bg-destructive/90 text-white">
                Sim, Excluir Categoria
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <LayoutDashboard className="h-5 w-5 text-blue-600" />
          <span className="text-[12px] font-black uppercase">Painel</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-primary min-w-[60px]">
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
