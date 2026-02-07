
"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Send, MapPin, User, Phone, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    complement: '',
    neighborhood: '',
    phone: ''
  });

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: loadingProfile } = useDoc(userDocRef);

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || '',
        address: `${userProfile.address || ''}${userProfile.number ? `, ${userProfile.number}` : ''}`,
        complement: userProfile.complement || '',
        neighborhood: userProfile.neighborhood || '',
        phone: userProfile.phone || ''
      });
    }
  }, [userProfile]);

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const total = getTotal();
  const deliveryFee = config?.deliveryFee || 0;

  const handleSendToWhatsApp = async () => {
    if (!form.name || !form.address || !form.neighborhood || !form.phone) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Por favor, preencha todos os campos obrigatórios para finalizar seu pedido."
      });
      return;
    }

    setLoading(true);
    
    try {
      const orderId = doc(collection(firestore, 'pedidos')).id;
      const orderData = {
        id: orderId,
        customerName: form.name,
        customerAddress: `${form.address}, ${form.neighborhood}${form.complement ? ` - ${form.complement}` : ''}`,
        customerPhoneNumber: form.phone,
        createdAt: serverTimestamp(),
        totalAmount: total + deliveryFee,
        status: 'New',
        userId: user?.uid || null
      };

      addDocumentNonBlocking(collection(firestore, 'pedidos'), orderData);
      
      addDocumentNonBlocking(collection(firestore, 'notificacoes'), {
        title: `Novo Pedido #${orderId.slice(-4).toUpperCase()}`,
        message: `Cliente ${form.name} acabou de pedir R$ ${(total + deliveryFee).toFixed(2)}.`,
        createdAt: serverTimestamp(),
        isRead: false,
        orderId: orderId
      });
      
      for (const item of items) {
        addDocumentNonBlocking(collection(firestore, 'pedidos', orderId, 'items'), {
          ...item,
          orderId
        });
      }

      const pizzeriaNumber = config?.whatsappNumber || "5511999999999";
      let message = `*NOVO PEDIDO - ${config?.restaurantName || 'Pizzaria'}*%0A%0A`;
      message += `*CLIENTE:* ${form.name}%0A`;
      message += `*TELEFONE:* ${form.phone}%0A`;
      message += `*ENDEREÇO:* ${form.address}%0A`;
      message += `*BAIRRO:* ${form.neighborhood}%0A`;
      if (form.complement) message += `*COMPLEMENTO:* ${form.complement}%0A`;
      message += `%0A*ITENS:*%0A`;

      items.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (${item.size})`;
        if (item.crust !== 'Tradicional') message += ` (Borda: ${item.crust})`;
        if (item.notes) message += ` [Obs: ${item.notes}]`;
        message += `%0A`;
      });

      message += `%0A*Subtotal:* R$ ${total.toFixed(2)}`;
      message += `%0A*Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}`;
      message += `%0A*TOTAL: R$ ${(total + deliveryFee).toFixed(2)}*%0A%0A`;

      const whatsappUrl = `https://wa.me/${pizzeriaNumber}?text=${message}`;
      
      setWaLink(whatsappUrl);
      setIsSuccess(true);
      clearCart();

      toast({
        title: "🚀 Pedido Realizado!",
        description: "Seu pedido foi processado com sucesso em nosso sistema.",
      });

    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Ocorreu um problema ao processar seu pedido. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen relative">
        <Card className="w-full max-w-2xl rounded-[3rem] border-4 border-green-50 shadow-2xl p-8 md:p-12 text-center space-y-8 animate-in zoom-in-95 duration-500 bg-white">
          <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-green-700 tracking-tighter">Pedido Realizado!</h2>
            <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
              Seu pedido foi processado com sucesso e já está sendo preparado pela nossa equipe.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-3xl border-2 border-dashed text-left space-y-3">
            <p className="font-bold text-lg text-primary flex items-center gap-2">
              <Send className="h-5 w-5" /> Importante:
            </p>
            <p className="text-muted-foreground font-medium">
              Clique no botão abaixo para enviar o detalhamento do seu pedido via WhatsApp. Isso agiliza o seu atendimento e garante que recebamos sua localização correta.
            </p>
          </div>

          <Button 
            onClick={() => window.open(waLink, '_blank')}
            className="w-full h-20 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-2xl font-black shadow-xl shadow-[#25D366]/30 transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            <Send className="h-8 w-8" />
            Enviar pelo WhatsApp
          </Button>

          <Link href="/menu" className="block text-muted-foreground font-bold text-lg hover:text-primary transition-colors">
            Voltar ao Cardápio
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 relative">
      <Link href="/menu" className="fixed top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-black hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar ao Cardápio
      </Link>

      <div className="max-w-4xl mx-auto mt-12 mb-12 text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">Finalizar Pedido</h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium">Confira seu carrinho e informe os dados para entrega</p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-6">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl text-muted-foreground">
            <Trash2 className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-black text-foreground">Seu pedido está vazio</h2>
          <p className="text-muted-foreground text-lg font-medium">Que tal escolher uma pizza deliciosa agora?</p>
          <Link href="/menu">
            <Button className="rounded-full h-16 px-12 text-2xl font-black bg-primary text-white shadow-xl shadow-primary/20">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 border-b py-6 px-8">
                <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 text-black">
                  Meu Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 md:gap-6 p-6 hover:bg-muted/20 transition-colors items-center">
                      <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white">
                        <Image 
                          src={item.imageUrl || 'https://placehold.co/400x400?text=Pizza'} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-black text-lg md:text-2xl truncate leading-tight text-black">{item.name}</h4>
                            <span className="font-black text-primary text-lg md:text-2xl shrink-0">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <p className="text-xs md:text-base font-bold text-muted-foreground mt-1">
                            {item.size} {item.crust && item.crust !== 'Tradicional' ? `• Borda ${item.crust}` : '• S/ Borda'}
                          </p>
                          {item.notes && <p className="text-[10px] md:text-sm text-primary/70 font-bold italic mt-2 line-clamp-1 bg-primary/5 px-2 py-1 rounded-lg">Obs: {item.notes}</p>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border-2 border-muted-foreground/10">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <span className="text-xl font-black">-</span>
                            </Button>
                            <span className="font-black text-sm md:text-xl w-6 md:w-10 text-center text-black">{item.quantity}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <span className="text-xl font-black">+</span>
                            </Button>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-primary/5 border-t-4 border-dashed space-y-4">
                  <div className="flex justify-between items-center text-lg md:text-xl font-bold">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-black">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg md:text-xl font-bold">
                    <span className="text-muted-foreground">Taxa de Entrega</span>
                    <span className={cn(deliveryFee > 0 ? "text-primary" : "text-green-600")}>
                      {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-3xl md:text-5xl font-black text-green-600 pt-6">
                    <span>Total</span>
                    <span className="drop-shadow-sm">R$ {(total + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-2 shadow-2xl bg-white">
              <CardHeader className="py-6 px-8 border-b">
                <CardTitle className="text-2xl md:text-3xl font-black text-black">Dados de Entrega</CardTitle>
                {user && !loadingProfile && (
                  <p className="text-xs text-green-600 font-black flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                    ENDEREÇO CARREGADO AUTOMATICAMENTE
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-8 pt-8 px-8">
                {loadingProfile ? (
                  <div className="flex justify-center py-16"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-lg md:text-xl font-black flex items-center gap-3 text-black">
                        <User className="h-6 w-6 text-primary" /> Nome Completo
                      </Label>
                      <Input 
                        id="name" 
                        placeholder="Como devemos te chamar?" 
                        className="h-14 md:h-16 rounded-2xl text-lg md:text-xl border-2 font-bold text-black bg-white focus:border-primary transition-all"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-lg md:text-xl font-black flex items-center gap-3 text-black">
                        <Phone className="h-6 w-6 text-primary" /> Telefone / WhatsApp
                      </Label>
                      <Input 
                        id="phone" 
                        placeholder="(00) 00000-0000" 
                        className="h-14 md:h-16 rounded-2xl text-lg md:text-xl border-2 font-bold text-black bg-white focus:border-primary transition-all"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-lg md:text-xl font-black flex items-center gap-3 text-black">
                        <MapPin className="h-6 w-6 text-primary" /> Endereço (Rua e Número)
                      </Label>
                      <Input 
                        id="address" 
                        placeholder="Ex: Rua das Pizzas, 123" 
                        className="h-14 md:h-16 rounded-2xl text-lg md:text-xl border-2 font-bold text-black bg-white focus:border-primary transition-all"
                        value={form.address}
                        onChange={(e) => setForm({...form, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="neighborhood" className="text-lg md:text-xl font-black text-black">Bairro</Label>
                        <Input 
                          id="neighborhood" 
                          placeholder="Ex: Centro" 
                          className="h-14 md:h-16 rounded-2xl text-lg md:text-xl border-2 font-bold text-black bg-white focus:border-primary transition-all"
                          value={form.neighborhood}
                          onChange={(e) => setForm({...form, neighborhood: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="complement" className="text-lg md:text-xl font-black text-black">Complemento</Label>
                        <Input 
                          id="complement" 
                          placeholder="Ex: Ap 42" 
                          className="h-14 md:h-16 rounded-2xl text-lg md:text-xl border-2 font-bold text-black bg-white focus:border-primary transition-all"
                          value={form.complement}
                          onChange={(e) => setForm({...form, complement: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleSendToWhatsApp}
                  disabled={loading || (config && !config.isStoreOpen)}
                  className={cn(
                    "w-full h-20 md:h-24 rounded-full text-white text-2xl md:text-3xl font-black shadow-2xl flex items-center justify-center gap-4 transform transition hover:scale-[1.02] active:scale-95 mt-10",
                    config && !config.isStoreOpen ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary shadow-primary/30'
                  )}
                >
                  {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : <Send className="h-8 w-8 md:h-10 md:w-10" />}
                  {config && !config.isStoreOpen ? 'Pizzaria Fechada' : loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
