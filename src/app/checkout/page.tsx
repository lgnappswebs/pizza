
"use client"

import { useState } from 'react';
import { Header } from '@/components/pizzeria/Header';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Send, ChevronLeft, MapPin, User, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    complement: '',
    neighborhood: '',
    phone: ''
  });

  const total = getTotal();

  const handleSendToWhatsApp = () => {
    if (!form.name || !form.address || !form.neighborhood || !form.phone) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    
    const pizzeriaNumber = "5511999999999"; // Exemplo
    let message = `*NOVO PEDIDO - PizzApp Rápido*%0A%0A`;
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

    message += `%0A*TOTAL: R$ ${total.toFixed(2)}*%0A%0A`;
    message += `_Enviado via PizzApp Rápido_`;

    const whatsappUrl = `https://wa.me/${pizzeriaNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-20 text-center space-y-6">
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
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link href="/menu" className="inline-flex items-center text-primary font-bold mb-6 hover:underline gap-1">
          <ChevronLeft className="h-5 w-5" /> Voltar ao Cardápio
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-2">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  Meu Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-muted/30">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                      <Image src={item.imageUrl || ''} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg truncate">{item.name}</h4>
                        <span className="font-bold text-primary">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.size} • {item.crust !== 'Tradicional' ? `Borda ${item.crust}` : 'S/ Borda'}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="font-bold w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t-2 border-dashed space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Taxa de Entrega</span>
                    <span className="text-green-600 font-bold">Grátis</span>
                  </div>
                  <div className="flex justify-between text-3xl font-black text-primary pt-2">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Details */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-2">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Dados de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Nome Completo
                  </Label>
                  <Input 
                    id="name" 
                    placeholder="Como devemos te chamar?" 
                    className="h-14 rounded-xl text-lg"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" /> Telefone / WhatsApp
                  </Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    className="h-14 rounded-xl text-lg"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Endereço (Rua e Número)
                  </Label>
                  <Input 
                    id="address" 
                    placeholder="Ex: Rua das Pizzas, 123" 
                    className="h-14 rounded-xl text-lg"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-lg font-semibold">Bairro</Label>
                    <Input 
                      id="neighborhood" 
                      placeholder="Ex: Centro" 
                      className="h-14 rounded-xl text-lg"
                      value={form.neighborhood}
                      onChange={(e) => setForm({...form, neighborhood: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement" className="text-lg font-semibold">Complemento</Label>
                    <Input 
                      id="complement" 
                      placeholder="Ex: Ap 42" 
                      className="h-14 rounded-xl text-lg"
                      value={form.complement}
                      onChange={(e) => setForm({...form, complement: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendToWhatsApp}
                  disabled={loading}
                  className="w-full h-20 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-2xl font-black shadow-xl shadow-[#25D366]/30 flex items-center justify-center gap-3 transform transition hover:scale-[1.02] active:scale-95 mt-6"
                >
                  <Send className="h-8 w-8" />
                  {loading ? 'Processando...' : 'Enviar Pedido pelo WhatsApp'}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Ao clicar em enviar, você será redirecionado para o WhatsApp com a mensagem pronta.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
