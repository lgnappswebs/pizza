
"use client"

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Store, 
  Phone, 
  Palette, 
  Truck, 
  Loader2,
  LayoutDashboard,
  Pizza as PizzaIcon,
  Package,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  setDocumentNonBlocking,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const [form, setForm] = useState({
    restaurantName: '',
    whatsappNumber: '',
    deliveryFee: '',
    primaryColor: '#FF4136'
  });

  useEffect(() => {
    if (config) {
      setForm({
        restaurantName: config.restaurantName || '',
        whatsappNumber: config.whatsappNumber || '',
        deliveryFee: config.deliveryFee?.toString() || '0',
        primaryColor: config.primaryColor || '#FF4136'
      });
    }
  }, [config]);

  const handleSave = () => {
    setLoading(true);
    const data = {
      ...form,
      deliveryFee: parseFloat(form.deliveryFee) || 0
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

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-primary">PizzApp Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <PizzaIcon className="mr-3 h-5 w-5" /> Produtos
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-lg h-12 text-muted-foreground hover:text-primary">
              <Package className="mr-3 h-5 w-5" /> Pedidos
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="secondary" className="w-full justify-start rounded-xl font-bold text-lg h-12">
              <Plus className="mr-3 h-5 w-5" /> Ajustes
            </Button>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Ajustes do Aplicativo</h1>
          <p className="text-muted-foreground">Personalize a identidade e regras da sua pizzaria</p>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" /> Identidade da Loja
              </CardTitle>
              <CardDescription>Nome e contatos principais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Pizzaria</Label>
                <Input 
                  id="name" 
                  value={form.restaurantName} 
                  onChange={(e) => setForm({...form, restaurantName: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp de Recebimento (com DDD)</Label>
                <Input 
                  id="whatsapp" 
                  placeholder="5511999999999"
                  value={form.whatsappNumber} 
                  onChange={(e) => setForm({...form, whatsappNumber: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Regras de Delivery
              </CardTitle>
              <CardDescription>Taxas e logística</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="fee">Taxa de Entrega Padrão (R$)</Label>
                <Input 
                  id="fee" 
                  type="number" 
                  step="0.01"
                  value={form.deliveryFee} 
                  onChange={(e) => setForm({...form, deliveryFee: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Visual
              </CardTitle>
              <CardDescription>Cores do aplicativo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="color">Cor Principal (Hexadecimal)</Label>
                <div className="flex gap-4">
                  <Input 
                    id="color" 
                    value={form.primaryColor} 
                    onChange={(e) => setForm({...form, primaryColor: e.target.value})}
                    className="rounded-xl h-12 font-mono"
                  />
                  <div 
                    className="w-12 h-12 rounded-xl border-2" 
                    style={{ backgroundColor: form.primaryColor }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-16 rounded-full text-xl font-bold bg-primary shadow-xl shadow-primary/20"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="mr-2 h-6 w-6" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </main>
    </div>
  );
}
