
"use client"

import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Loader2,
  CheckCircle2,
  Truck,
  Timer,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Settings as SettingsIcon,
  LogOut,
  Layers,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  useUser 
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const ordersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: orders, isLoading } = useCollection(ordersQuery);

  if (isUserLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/admin/login');
  };

  const updateStatus = (orderId: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', orderId), { status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return <Badge className="bg-blue-500">Novo</Badge>;
      case 'Preparing': return <Badge className="bg-yellow-500">Em Preparo</Badge>;
      case 'Out for Delivery': return <Badge className="bg-purple-500">Saiu para Entrega</Badge>;
      case 'Delivered': return <Badge className="bg-green-500">Entregue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
              <Package className="mr-3 h-5 w-5" /> Pedidos
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Monitor de Pedidos</h1>
            <p className="text-muted-foreground">Acompanhe e gerencie os pedidos em tempo real</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders?.map((order) => (
              <Card key={order.id} className="rounded-2xl border-2 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xl text-primary">#{order.id.slice(-4).toUpperCase()}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "HH:mm 'de' d 'de' MMM", { locale: ptBR }) : 'Recentemente'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">R$ {order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</p>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> {order.customerPhoneNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> 
                          {order.customerAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 w-full md:w-80 border-t md:border-t-0 md:border-l space-y-4">
                    <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Atualizar Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={order.status === 'Preparing' ? 'default' : 'outline'} 
                        size="sm" 
                        className="rounded-xl h-10"
                        onClick={() => updateStatus(order.id, 'Preparing')}
                      >
                        <Timer className="h-4 w-4 mr-2" /> Preparar
                      </Button>
                      <Button 
                        variant={order.status === 'Out for Delivery' ? 'default' : 'outline'} 
                        size="sm" 
                        className="rounded-xl h-10"
                        onClick={() => updateStatus(order.id, 'Out for Delivery')}
                      >
                        <Truck className="h-4 w-4 mr-2" /> Entregar
                      </Button>
                      <Button 
                        variant={order.status === 'Delivered' ? 'default' : 'outline'} 
                        size="sm" 
                        className="rounded-xl h-10 col-span-2"
                        onClick={() => updateStatus(order.id, 'Delivered')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {orders?.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted" />
                <h3 className="text-xl font-bold">Nenhum pedido hoje</h3>
                <p className="text-muted-foreground">Assim que alguém pedir, aparecerá aqui!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t flex md:hidden items-center justify-around px-2 z-50 overflow-x-auto">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Painel</span>
        </Link>
        <Link href="/admin/products" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <PizzaIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Prods</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Cats</span>
        </Link>
        <Link href="/admin/orders" className="flex flex-col items-center gap-1 text-primary min-w-[60px]">
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase">Peds</span>
        </Link>
        <Link href="/admin/banners" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Banners</span>
        </Link>
        <Link href="/admin/settings" className="flex flex-col items-center gap-1 text-muted-foreground min-w-[60px]">
          <SettingsIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Personalizar</span>
        </Link>
      </nav>
    </div>
  );
}
