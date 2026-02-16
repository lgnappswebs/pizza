
"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Send, 
  MapPin, 
  User, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Copy, 
  Check,
  ShoppingBag,
  Truck,
  Store
} from 'lucide-react';
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
    cashChange: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup'
  });

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc(userDocRef);

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

  const subtotal = getTotal();
  const deliveryFee = form.deliveryType === 'delivery' ? (config?.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  const handleCopyPix = () => {
    if (config?.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setCopied(true);
      toast({ title: "Copiado!", description: "Chave Pix copiada." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendToWhatsApp = async () => {
    // Validação básica
    if (!form.name || !form.phone || !form.paymentMethod) {
      toast({ variant: "destructive", title: "Atenção", description: "Preencha seu nome, telefone e forma de pagamento." });
      return;
    }

    if (form.deliveryType === 'delivery' && (!form.address || !form.neighborhood)) {
      toast({ variant: "destructive", title: "Atenção", description: "O endereço de entrega é obrigatório." });
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
      customerAddress: form.deliveryType === 'delivery' 
        ? `${form.address}, ${form.neighborhood}${form.complement ? ` - ${form.complement}` : ''}`
        : 'RETIRADA NA LOJA',
      customerPhoneNumber: form.phone,
      createdAt: serverTimestamp(),
      totalAmount: total,
      status: 'New',
      userId: user?.uid || null,
      paymentMethod: form.paymentMethod,
      paymentDetails: paymentDetails,
      deliveryType: form.deliveryType
    };

    addDocumentNonBlocking(collection(firestore, 'pedidos'), orderData);
    addDocumentNonBlocking(collection(firestore, 'notificacoes'), {
      title: `Novo Pedido #${orderId.slice(-4).toUpperCase()}`,
      message: `Cliente ${form.name} pediu R$ ${total.toFixed(2)} (${form.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}).`,
      createdAt: serverTimestamp(),
      isRead: false,
      orderId: orderId
    });
    
    items.forEach(item => addDocumentNonBlocking(collection(firestore, 'pedidos', orderId, 'items'), { ...item, orderId }));

    const pizzeriaNumber = config?.whatsappNumber || "5511999999999";
    let msg = `*NOVO PEDIDO - ${config?.restaurantName || 'Pizzaria'}*%0A%0A`;
    msg += `*TIPO:* ${form.deliveryType === 'delivery' ? 'ENTREGA' : 'RETIRADA NA LOJA'}%0A`;
    msg += `*CLIENTE:* ${form.name}%0A`;
    msg += `*FONE:* ${form.phone}%0A`;
    if (form.deliveryType === 'delivery') {
      msg += `*ENDEREÇO:* ${form.address}, ${form.neighborhood}${form.complement ? ` (${form.complement})` : ''}%0A`;
    }
    msg += `%0A*ITENS:*%0A`;
    items.forEach(i => msg += `- ${i.quantity}x ${i.name} (${i.size})%0A`);
    msg += `%0A*SUBTOTAL:* R$ ${subtotal.toFixed(2)}`;
    msg += `%0A*TAXA:* R$ ${deliveryFee.toFixed(2)}`;
    msg += `%0A*TOTAL: R$ ${total.toFixed(2)}*%0A`;
    msg += `%0A*PAGAMENTO:* ${form.paymentMethod}${paymentDetails ? ` (${paymentDetails})` : ''}`;

    const whatsappUrl = `https://wa.me/${pizzeriaNumber}?text=${msg}`;
    window.open(whatsappUrl, '_blank');
    setWaLink(whatsappUrl);
    setIsSuccess(true);
    clearCart();
    setLoading(false);
  };

  if (isSuccess) {
    return (
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl rounded-[3rem] border-4 border-green-100 shadow-2xl p-8 text-center space-y-8 animate-in zoom-in-95 bg-white">
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 className="h-16 w-16 text-green-600" /></div>
          <h2 className="text-4xl font-black text-green-700">Pedido Gravado!</h2>
          <p className="text-lg font-medium text-muted-foreground">O resumo do seu pedido foi enviado para o nosso WhatsApp. Agora é só aguardar!</p>
          <Button onClick={() => router.push('/menu')} className="w-full h-20 rounded-full bg-primary text-white text-2xl font-black shadow-xl">FINALIZAR PEDIDO</Button>
          <button onClick={() => window.open(waLink, '_blank')} className="text-primary font-bold text-sm underline opacity-70">Tentar enviar ao WhatsApp novamente</button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/menu" className="fixed top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-black hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar
      </Link>
      
      <div className="max-w-4xl mx-auto mt-16 mb-12 text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Finalizar Pedido</h1>
        <p className="text-muted-foreground font-medium">Confira seus itens e escolha como quer receber</p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-6">
          <h2 className="text-3xl font-black">Seu pedido está vazio</h2>
          <Link href="/menu"><Button className="rounded-full h-16 px-12 text-xl font-black bg-primary text-white">Ver Cardápio</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b py-6 px-8 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-black">Meu Pedido</CardTitle>
                <Badge variant="outline" className="border-2 font-bold px-3 py-1">{items.length} itens</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-6 items-center">
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 border-2">
                        <Image src={item.imageUrl || 'https://placehold.co/400x400'} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black truncate text-lg">{item.name}</h4>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{item.size} • {item.crust}</p>
                          </div>
                          <span className="font-black text-primary text-lg">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                          <span className="font-black w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                          <Button variant="ghost" size="icon" className="ml-auto text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-muted/30 border-t-4 border-dashed space-y-3">
                  <div className="flex justify-between text-lg font-bold text-muted-foreground">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-muted-foreground">
                    <span>Taxa de Entrega</span>
                    <span>{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                    <span className="text-2xl font-black text-black uppercase tracking-tight">Total</span>
                    <span className="text-4xl md:text-5xl font-black text-green-600 tracking-tighter">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Truck className="h-6 w-6 text-primary" /> Como prefere receber?
                </h3>
                <RadioGroup 
                  value={form.deliveryType} 
                  onValueChange={(v: any) => setForm({...form, deliveryType: v})}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label htmlFor="type-delivery" className={cn(
                    "flex flex-col items-center gap-3 p-6 border-2 rounded-[2rem] cursor-pointer transition-all",
                    form.deliveryType === 'delivery' ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-muted hover:border-primary/30"
                  )}>
                    <RadioGroupItem value="delivery" id="type-delivery" className="sr-only" />
                    <Truck className={cn("h-8 w-8", form.deliveryType === 'delivery' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-black text-sm uppercase">Entregar</span>
                  </Label>
                  <Label htmlFor="type-pickup" className={cn(
                    "flex flex-col items-center gap-3 p-6 border-2 rounded-[2rem] cursor-pointer transition-all",
                    form.deliveryType === 'pickup' ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-muted hover:border-primary/30"
                  )}>
                    <RadioGroupItem value="pickup" id="type-pickup" className="sr-only" />
                    <Store className={cn("h-8 w-8", form.deliveryType === 'pickup' ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-black text-sm uppercase">Retirar</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" /> Seus Dados
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Seu Nome</Label>
                    <Input placeholder="Como devemos te chamar?" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-14 rounded-2xl border-2 bg-white text-lg font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Seu WhatsApp</Label>
                    <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-14 rounded-2xl border-2 bg-white text-lg font-medium" />
                  </div>
                  
                  {form.deliveryType === 'delivery' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-2">
                        <Label className="font-bold ml-1">Endereço Completo</Label>
                        <Input placeholder="Rua e Número" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-14 rounded-2xl border-2 bg-white text-lg font-medium" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Bairro</Label>
                          <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({...form, neighborhood: e.target.value})} className="h-14 rounded-2xl border-2 bg-white text-lg font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold ml-1">Complemento</Label>
                          <Input placeholder="Ap, Bloco..." value={form.complement} onChange={(e) => setForm({...form, complement: e.target.value})} className="h-14 rounded-2xl border-2 bg-white text-lg font-medium" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" /> Pagamento
                </h3>
                <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm({...form, paymentMethod: v})} className="grid gap-4">
                  {config?.pixEnabled && (
                    <Label htmlFor="p-pix" className={cn(
                      "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all", 
                      form.paymentMethod === 'pix' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-white hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="pix" id="p-pix" className="sr-only" />
                      <div className="bg-emerald-100 p-2 rounded-xl"><QrCode className="h-6 w-6 text-emerald-600" /></div>
                      <span className="font-black text-lg">Pagar via PIX</span>
                    </Label>
                  )}
                  {config?.cardOnDeliveryEnabled && (
                    <Label htmlFor="p-card" className={cn(
                      "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all", 
                      form.paymentMethod === 'card' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-white hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="card" id="p-card" className="sr-only" />
                      <div className="bg-blue-100 p-2 rounded-xl"><CreditCard className="h-6 w-6 text-blue-600" /></div>
                      <span className="font-black text-lg">Cartão na Entrega</span>
                    </Label>
                  )}
                  {config?.cashOnDeliveryEnabled && (
                    <Label htmlFor="p-cash" className={cn(
                      "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all", 
                      form.paymentMethod === 'cash' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-white hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="cash" id="p-cash" className="sr-only" />
                      <div className="bg-green-100 p-2 rounded-xl"><Banknote className="h-6 w-6 text-green-600" /></div>
                      <span className="font-black text-lg">Dinheiro</span>
                    </Label>
                  )}
                </RadioGroup>

                {form.paymentMethod === 'pix' && config?.pixKey && (
                  <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Chave para Pagamento</span>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700 font-bold bg-white">{config.pixKeyType}</Badge>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input readOnly value={config.pixKey} className="h-14 bg-white border-2 border-emerald-100 font-black text-emerald-900 rounded-xl text-center" />
                      <Button onClick={handleCopyPix} size="icon" className="h-14 w-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 shrink-0 shadow-lg">
                        {copied ? <Check className="h-6 w-6 text-white" /> : <Copy className="h-6 w-6 text-white" />}
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-600 font-bold text-center px-4">Copie a chave e pague no seu banco. Após o pagamento, finalize o pedido abaixo.</p>
                  </div>
                )}

                {form.paymentMethod === 'cash' && (
                  <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] space-y-3 animate-in fade-in">
                    <Label htmlFor="change" className="text-sm font-black text-amber-800 uppercase tracking-wider">Precisa de troco para quanto?</Label>
                    <Input id="change" placeholder="Ex: R$ 100,00" value={form.cashChange} onChange={(e) => setForm({...form, cashChange: e.target.value})} className="h-14 bg-white border-2 border-amber-100 font-black rounded-xl text-lg" />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSendToWhatsApp} 
                disabled={loading || !config?.isStoreOpen} 
                className="w-full h-24 rounded-full bg-primary hover:bg-primary/90 text-white text-2xl font-black shadow-2xl shadow-primary/40 mt-10 transform transition hover:scale-[1.02] active:scale-95 disabled:grayscale"
              >
                {loading ? <Loader2 className="animate-spin h-10 w-10" /> : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Enviar Pedido</span>
                    <div className="flex items-center gap-2">
                      <Send className="h-7 w-7" /> Finalizar Agora
                    </div>
                  </div>
                )}
              </Button>
              
              {!config?.isStoreOpen && <p className="text-center text-destructive font-black text-sm uppercase tracking-widest">Loja fechada no momento</p>}
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
