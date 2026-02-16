
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
  QrCode, 
  CreditCard, 
  Banknote, 
  Copy, 
  Check,
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
    let paymentLabel = '';

    if (form.paymentMethod === 'cash') {
      paymentLabel = 'Dinheiro';
      paymentDetails = form.cashChange ? `Troco para R$ ${form.cashChange}` : 'Sem troco';
    } else if (form.paymentMethod === 'pix') {
      paymentLabel = `PIX (${config?.pixKeyType || 'Chave'})`;
      paymentDetails = config?.pixKey || 'N/A';
    } else if (form.paymentMethod === 'card') {
      paymentLabel = 'Cartão na Entrega';
      paymentDetails = 'Levar Maquininha';
    }

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
    
    let msg = `*🔥 NOVO PEDIDO - ${config?.restaurantName?.toUpperCase() || 'PIZZARIA'}*%0A%0A`;
    msg += `*📍 TIPO DE PEDIDO:*%0A`;
    msg += `${form.deliveryType === 'delivery' ? '🚚 ENTREGA EM CASA' : '🛍️ RETIRADA NA LOJA'}%0A%0A`;
    msg += `*👤 DADOS DO CLIENTE:*%0A`;
    msg += `Nome: ${form.name}%0A`;
    msg += `WhatsApp: ${form.phone}%0A`;
    if (form.deliveryType === 'delivery') {
      msg += `Endereço: ${form.address}%0A`;
      msg += `Bairro: ${form.neighborhood}%0A`;
      if (form.complement) msg += `Complemento: ${form.complement}%0A`;
    }
    msg += `%0A*🍕 ITENS DO PEDIDO:*%0A`;
    items.forEach(i => {
      msg += `• ${i.quantity}x ${i.name}%0A`;
      msg += `  Tam: ${i.size}${i.crust !== 'Tradicional' ? ` | Borda: ${i.crust}` : ''}%0A`;
      if (i.notes) msg += `  _Obs: ${i.notes}_%0A`;
    });
    msg += `%0A*💰 RESUMO DE VALORES:*%0A`;
    msg += `Subtotal: R$ ${subtotal.toFixed(2)}%0A`;
    if (form.deliveryType === 'delivery') msg += `Taxa de Entrega: R$ ${deliveryFee.toFixed(2)}%0A`;
    msg += `*TOTAL: R$ ${total.toFixed(2)}*%0A%0A`;
    msg += `*💳 FORMA DE PAGAMENTO:*%0A`;
    msg += `Método: ${paymentLabel}%0A`;
    if (paymentDetails) msg += `Detalhe: ${paymentDetails}%0A`;
    if (form.paymentMethod === 'pix') {
      msg += `%0A⚠️ *AVISO IMPORTANTE:*%0A`;
      msg += `O pedido só será iniciado após o envio do comprovante do pagamento Pix aqui na conversa.`;
    }

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
          <h2 className="text-4xl font-black text-green-700">Pedido Enviado!</h2>
          <p className="text-lg font-medium text-muted-foreground">Seu resumo foi enviado ao WhatsApp. Clique no botão abaixo para voltar ao cardápio.</p>
          <Button onClick={() => router.push('/menu')} className="w-full h-20 rounded-full bg-primary text-white text-2xl font-black shadow-xl">FINALIZAR PEDIDO</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/menu" className="fixed top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-black hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar
      </Link>
      
      <div className="max-w-4xl mx-auto mt-16 mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Finalizar Pedido</h1>
        <p className="text-muted-foreground font-medium">Quase lá! Escolha como prefere receber sua pizza.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white p-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" /> Como prefere receber?
            </h3>
            <RadioGroup 
              value={form.deliveryType} 
              onValueChange={(v: any) => setForm({...form, deliveryType: v})}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label htmlFor="type-delivery" className={cn(
                "flex items-center gap-4 p-6 border-2 rounded-[2rem] cursor-pointer transition-all",
                form.deliveryType === 'delivery' ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-muted hover:border-primary/30"
              )}>
                <RadioGroupItem value="delivery" id="type-delivery" className="sr-only" />
                <div className={cn("p-3 rounded-2xl", form.deliveryType === 'delivery' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Truck className="h-8 w-8" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg">ENTREGAR</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Receba em casa</span>
                </div>
              </Label>
              <Label htmlFor="type-pickup" className={cn(
                "flex items-center gap-4 p-6 border-2 rounded-[2rem] cursor-pointer transition-all",
                form.deliveryType === 'pickup' ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-muted hover:border-primary/30"
              )}>
                <RadioGroupItem value="pickup" id="type-pickup" className="sr-only" />
                <div className={cn("p-3 rounded-2xl", form.deliveryType === 'pickup' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Store className="h-8 w-8" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg">RETIRAR</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Na nossa loja</span>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b py-6 px-8">
                <CardTitle className="text-2xl font-black">Meu Pedido</CardTitle>
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
                            <p className="text-xs text-muted-foreground font-bold uppercase">{item.size} • {item.crust}</p>
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
                    <span className={form.deliveryType === 'pickup' ? "line-through opacity-50" : ""}>
                      {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                    <span className="text-2xl font-black text-black uppercase">Total</span>
                    <span className="text-4xl font-black text-green-600">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" /> Seus Dados
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Seu Nome</Label>
                    <Input placeholder="Como devemos te chamar?" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="h-14 rounded-2xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Seu WhatsApp</Label>
                    <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="h-14 rounded-2xl border-2" />
                  </div>
                  
                  {form.deliveryType === 'delivery' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="font-bold">Endereço Completo</Label>
                        <Input placeholder="Rua e Número" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="h-14 rounded-2xl border-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold">Bairro</Label>
                          <Input placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({...form, neighborhood: e.target.value})} className="h-14 rounded-2xl border-2" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold">Complemento</Label>
                          <Input placeholder="Ap, Bloco..." value={form.complement} onChange={(e) => setForm({...form, complement: e.target.value})} className="h-14 rounded-2xl border-2" />
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
                      form.paymentMethod === 'pix' ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="pix" id="p-pix" className="sr-only" />
                      <QrCode className="h-6 w-6 text-emerald-600" />
                      <span className="font-black text-lg">PIX</span>
                    </Label>
                  )}
                  {config?.cardOnDeliveryEnabled && (
                    <Label htmlFor="p-card" className={cn(
                      "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all", 
                      form.paymentMethod === 'card' ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="card" id="p-card" className="sr-only" />
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <span className="font-black text-lg">Cartão na Entrega</span>
                    </Label>
                  )}
                  {config?.cashOnDeliveryEnabled && (
                    <Label htmlFor="p-cash" className={cn(
                      "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all", 
                      form.paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20"
                    )}>
                      <RadioGroupItem value="cash" id="p-cash" className="sr-only" />
                      <Banknote className="h-6 w-6 text-green-600" />
                      <span className="font-black text-lg">Dinheiro</span>
                    </Label>
                  )}
                </RadioGroup>

                {form.paymentMethod === 'pix' && config?.pixKey && (
                  <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] space-y-4 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Pague via PIX</span>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700 font-bold bg-white">{config.pixKeyType}</Badge>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input readOnly value={config.pixKey} className="h-12 bg-white border-2 border-emerald-100 font-black text-emerald-900 rounded-xl flex-1" />
                      <Button onClick={handleCopyPix} size="icon" className="h-12 w-12 rounded-xl bg-emerald-600 shrink-0">
                        {copied ? <Check className="h-5 w-5 text-white" /> : <Copy className="h-5 w-5 text-white" />}
                      </Button>
                    </div>
                  </div>
                )}

                {form.paymentMethod === 'cash' && (
                  <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] space-y-3 animate-in fade-in">
                    <Label className="text-sm font-black text-amber-800">Precisa de troco?</Label>
                    <Input placeholder="Troco para quanto? (Ex: R$ 50,00)" value={form.cashChange} onChange={(e) => setForm({...form, cashChange: e.target.value})} className="h-12 bg-white border-2 border-amber-100 font-black rounded-xl" />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSendToWhatsApp} 
                disabled={loading || !form.paymentMethod} 
                className="w-full h-24 rounded-full bg-primary hover:bg-primary/90 text-white text-2xl font-black shadow-2xl shadow-primary/40 mt-10 transform transition hover:scale-[1.02] active:scale-95 disabled:grayscale"
              >
                {loading ? <Loader2 className="animate-spin h-10 w-10" /> : (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase opacity-80 mb-1">Finalizar Pedido</span>
                    <div className="flex items-center gap-2">
                      <Send className="h-7 w-7" /> Enviar para WhatsApp
                    </div>
                  </div>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
