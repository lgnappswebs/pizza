
"use client"

import { useState, useEffect } from 'react';
import { Header } from '@/components/pizzeria/Header';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Send, ArrowLeft, MapPin, User, Phone, Loader2, CheckCircle2 } from 'lucide-react';
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
      <>
        <Header />
        <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <Card className="w-full max-w-2xl rounded-[3rem] border-4 border-green-50 shadow-2xl p-8 md:p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
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
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Link href="/menu" className="fixed top-24 left-4 md:top-24 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
            <ArrowLeft className="h-5 w-5" /> Voltar ao Cardápio
          </Link>
          <div className="py-20 text-center space-y-6 mt-36 md:mt-24">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Trash2 className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold">Seu pedido está vazio</h2>
            <p className="text-muted-foreground text-lg">Que tal escolher uma pizza deliciosa agora?</p>
            <Link href="/menu">
              <Button className="rounded-full h-14 px-10 text-xl font-bold bg-primary">
                Ver Cardápio
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link href="/menu" className="fixed top-24 left-4 md:top-24 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-5 w-5" /> Voltar ao Cardápio
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-36 md:mt-24">
          <div className="space-y-6">
            <Card className="rounded-3xl border-2 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b py-4">
                <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-2">
                  Meu Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 md:gap-4 p-4 hover:bg-muted/20 transition-colors items-center">
                      <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden shrink-0 shadow-sm border">
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
                            <h4 className="font-bold text-sm md:text-lg truncate leading-tight">{item.name}</h4>
                            <span className="font-bold text-primary text-sm md:text-lg shrink-0">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">
                            {item.size} {item.crust && item.crust !== 'Tradicional' ? `• Borda ${item.crust}` : '• S/ Borda'}
                          </p>
                          {item.notes && <p className="text-[9px] md:text-xs text-primary/70 italic mt-1 line-clamp-1">Obs: {item.notes}</p>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 md:gap-2 bg-muted p-1 rounded-full border border-muted-foreground/10">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 md:h-8 md:w-8 rounded-full hover:bg-white transition-colors"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <span className="text-lg">-</span>
                            </Button>
                            <span className="font-black text-xs md:text-base w-5 md:w-8 text-center">{item.quantity}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 md:h-8 md:w-8 rounded-full hover:bg-white transition-colors"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <span className="text-lg">+</span>
                            </Button>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-primary/5 border-t-2 border-dashed space-y-3">
                  <div className="flex justify-between items-center text-sm md:text-lg">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-lg">
                    <span className="text-muted-foreground font-medium">Taxa de Entrega</span>
                    <span className={cn("font-bold", deliveryFee > 0 ? "text-primary" : "text-green-600")}>
                      {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-2xl md:text-4xl font-black text-green-600 pt-4">
                    <span>Total</span>
                    <span className="drop-shadow-sm">R$ {(total + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-2 shadow-sm">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xl md:text-2xl font-black">Dados de Entrega</CardTitle>
                {user && !loadingProfile && (
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                    Endereço carregado da sua conta!
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {loadingProfile ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base md:text-lg font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" /> Nome Completo
                      </Label>
                      <Input 
                        id="name" 
                        placeholder="Como devemos te chamar?" 
                        className="h-12 md:h-14 rounded-xl text-base md:text-lg border-2"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base md:text-lg font-bold flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" /> Telefone / WhatsApp
                      </Label>
                      <Input 
                        id="phone" 
                        placeholder="(00) 00000-0000" 
                        className="h-12 md:h-14 rounded-xl text-base md:text-lg border-2"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-base md:text-lg font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> Endereço (Rua e Número)
                      </Label>
                      <Input 
                        id="address" 
                        placeholder="Ex: Rua das Pizzas, 123" 
                        className="h-12 md:h-14 rounded-xl text-base md:text-lg border-2"
                        value={form.address}
                        onChange={(e) => setForm({...form, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood" className="text-base md:text-lg font-bold">Bairro</Label>
                        <Input 
                          id="neighborhood" 
                          placeholder="Ex: Centro" 
                          className="h-12 md:h-14 rounded-xl text-base md:text-lg border-2"
                          value={form.neighborhood}
                          onChange={(e) => setForm({...form, neighborhood: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complement" className="text-base md:text-lg font-bold">Complemento</Label>
                        <Input 
                          id="complement" 
                          placeholder="Ex: Ap 42" 
                          className="h-12 md:h-14 rounded-xl text-base md:text-lg border-2"
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
                    "w-full h-16 md:h-20 rounded-full text-white text-xl md:text-2xl font-black shadow-xl flex items-center justify-center gap-3 transform transition hover:scale-[1.02] active:scale-95 mt-6",
                    config && !config.isStoreOpen ? 'bg-muted text-muted-foreground' : 'bg-primary shadow-primary/30'
                  )}
                >
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Send className="h-7 w-7 md:h-8 md:w-8" />}
                  {config && !config.isStoreOpen ? 'Pizzaria Fechada' : loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
