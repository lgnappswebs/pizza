
"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Send, MapPin, User, Phone, Loader2, CheckCircle2, ArrowLeft, AlertCircle, QrCode, CreditCard, Banknote, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [waSent, setWaSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    complement: '',
    neighborhood: '',
    phone: '',
    paymentMethod: '',
    cashChange: ''
  });

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: loadingProfile } = useDoc(userDocRef);

  useEffect(() => {
    if (userProfile) {
      setForm(prev => ({
        ...prev,
        name: userProfile.name || '',
        address: `${userProfile.address || ''}${userProfile.number ? `, ${userProfile.number}` : ''}`,
        complement: userProfile.complement || '',
        neighborhood: userProfile.neighborhood || '',
        phone: userProfile.phone || ''
      }));
    }
  }, [userProfile]);

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const total = getTotal();
  const deliveryFee = config?.deliveryFee || 0;

  const handleCopyPix = () => {
    if (config?.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setCopied(true);
      toast({ title: "Copiado!", description: "Chave Pix copiada." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendToWhatsApp = async () => {
    if (!form.name || !form.address || !form.neighborhood || !form.phone || !form.paymentMethod) {
      toast({ variant: "destructive", title: "Atenção", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    setLoading(true);
    const orderId = doc(collection(firestore, 'pedidos')).id;
    let paymentDetails = '';
    if (form.paymentMethod === 'cash' && form.cashChange) paymentDetails = `Troco para R$ ${form.cashChange}`;
    else if (form.paymentMethod === 'pix') paymentDetails = `Pagamento via PIX (${config?.pixKeyType || 'Chave'}: ${config?.pixKey || 'N/A'})`;
    else if (form.paymentMethod === 'card') paymentDetails = 'Cartão na Entrega';

    const orderData = {
      id: orderId,
      customerName: form.name,
      customerAddress: `${form.address}, ${form.neighborhood}${form.complement ? ` - ${form.complement}` : ''}`,
      customerPhoneNumber: form.phone,
      createdAt: serverTimestamp(),
      totalAmount: total + deliveryFee,
      status: 'New',
      userId: user?.uid || null,
      paymentMethod: form.paymentMethod,
      paymentDetails: paymentDetails
    };

    addDocumentNonBlocking(collection(firestore, 'pedidos'), orderData);
    addDocumentNonBlocking(collection(firestore, 'notificacoes'), {
      title: `Novo Pedido #${orderId.slice(-4).toUpperCase()}`,
      message: `Cliente ${form.name} pediu R$ ${(total + deliveryFee).toFixed(2)}.`,
      createdAt: serverTimestamp(),
      isRead: false,
      orderId: orderId
    });
    
    items.forEach(item => addDocumentNonBlocking(collection(firestore, 'pedidos', orderId, 'items'), { ...item, orderId }));

    const pizzeriaNumber = config?.whatsappNumber || "5511999999999";
    let msg = `*NOVO PEDIDO - ${config?.restaurantName || 'Pizzaria'}*%0A%0A*CLIENTE:* ${form.name}%0A*ITENS:*%0A`;
    items.forEach(i => msg += `- ${i.quantity}x ${i.name} (${i.size})%0A`);
    msg += `%0ATOTAL: R$ ${(total + deliveryFee).toFixed(2)}%0APAGAMENTO: ${form.paymentMethod}`;

    const whatsappUrl = `https://wa.me/${pizzeriaNumber}?text=${msg}`;
    window.open(whatsappUrl, '_blank');
    setWaLink(whatsappUrl);
    setIsSuccess(true);
    setWaSent(true);
    clearCart();
    setLoading(false);
  };

  if (isSuccess) {
    return (
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl rounded-[3rem] border-4 border-green-100 shadow-2xl p-8 text-center space-y-8 animate-in zoom-in-95 bg-white">
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 className="h-16 w-16 text-green-600" /></div>
          <h2 className="text-4xl font-black text-green-700">Pedido Gravado!</h2>
          <Button onClick={() => router.push('/menu')} className="w-full h-20 rounded-full bg-primary text-white text-2xl font-black shadow-xl">FINALIZAR PEDIDO</Button>
          <button onClick={() => window.open(waLink, '_blank')} className="text-primary font-bold text-sm underline opacity-70">Tentar enviar ao WhatsApp novamente</button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/menu" className="fixed top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-black hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10">
        <ArrowLeft className="h-5 w-5" /> Voltar
      </Link>
      <div className="max-w-4xl mx-auto mt-12 mb-12 text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Finalizar Pedido</h1>
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center space-y-6"><h2 className="text-3xl font-black">Pedido Vazio</h2><Link href="/menu"><Button className="rounded-full h-16 px-12 text-xl font-black bg-primary text-white">Ver Cardápio</Button></Link></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b py-6 px-8"><CardTitle className="text-2xl font-black">Meu Pedido</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-6 items-center">
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 border-2"><Image src={item.imageUrl || 'https://placehold.co/400x400'} alt={item.name} fill className="object-cover" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start"><h4 className="font-black truncate text-lg">{item.name}</h4><span className="font-black text-primary">R$ {(item.price * item.quantity).toFixed(2)}</span></div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                          <span className="font-black w-6 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                          <Button variant="ghost" size="icon" className="ml-auto text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-primary/5 border-t-4 border-dashed text-right"><span className="text-3xl md:text-5xl font-black text-green-600">Total: R$ {(total + deliveryFee).toFixed(2)}</span></div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white p-8 space-y-6">
              <h3 className="text-2xl font-black">Dados de Entrega</h3>
              <div className="space-y-4">
                <Input placeholder="Nome Completo" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-14 rounded-xl border-2 bg-white" />
                <Input placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-14 rounded-xl border-2 bg-white" />
                <Input placeholder="Endereço" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-14 rounded-xl border-2 bg-white" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({...form, neighborhood: e.target.value})} className="h-14 rounded-xl border-2 bg-white" />
                  <Input placeholder="Complemento" value={form.complement} onChange={(e) => setForm({...form, complement: e.target.value})} className="h-14 rounded-xl border-2 bg-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black pt-4">Pagamento</h3>
              <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({...form, paymentMethod: v})} className="grid gap-4">
                {config?.pixEnabled && <Label htmlFor="p-pix" className={cn("flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer", form.paymentMethod === 'pix' ? "border-primary bg-primary/5" : "border-muted bg-white")}>
                  <RadioGroupItem value="pix" id="p-pix" className="sr-only" /><QrCode className="text-emerald-600" /> PIX
                </Label>}
                {config?.cardOnDeliveryEnabled && <Label htmlFor="p-card" className={cn("flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer", form.paymentMethod === 'card' ? "border-primary bg-primary/5" : "border-muted bg-white")}>
                  <RadioGroupItem value="card" id="p-card" className="sr-only" /><CreditCard className="text-blue-600" /> Cartão na Entrega
                </Label>}
                {config?.cashOnDeliveryEnabled && <Label htmlFor="p-cash" className={cn("flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer", form.paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-muted bg-white")}>
                  <RadioGroupItem value="cash" id="p-cash" className="sr-only" /><Banknote className="text-green-600" /> Dinheiro
                </Label>}
              </RadioGroup>

              {form.paymentMethod === 'pix' && config?.pixKey && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Pague via PIX</span>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 font-bold">{config.pixKeyType}</Badge>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input readOnly value={config.pixKey} className="h-12 bg-white border-2 border-emerald-100 font-black text-emerald-900 rounded-xl" />
                    <Button onClick={handleCopyPix} size="icon" className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shrink-0">
                      {copied ? <Check className="h-5 w-5 text-white" /> : <Copy className="h-5 w-5 text-white" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium">Copie a chave e pague no app do seu banco. Após o pagamento, envie o pedido pelo botão abaixo.</p>
                </div>
              )}

              {form.paymentMethod === 'cash' && (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <Label htmlFor="change" className="text-sm font-bold text-amber-800">Troco para quanto?</Label>
                  <Input id="change" placeholder="Ex: R$ 100,00" value={form.cashChange} onChange={(e) => setForm({...form, cashChange: e.target.value})} className="h-12 bg-white border-2 border-amber-100 font-bold rounded-xl" />
                </div>
              )}

              <Button onClick={handleSendToWhatsApp} disabled={loading || !config?.isStoreOpen} className="w-full h-20 rounded-full bg-primary text-white text-2xl font-black shadow-2xl mt-6">
                {loading ? <Loader2 className="animate-spin h-8 w-8" /> : "Finalizar e Enviar"}
              </Button>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
