
"use client"

import Image from 'next/image';
import { Plus, Minus, Pizza as PizzaIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/cart-store';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isPromotion?: boolean;
  promotionSize?: string;
  hasMultipleSizes?: boolean;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
  allProducts?: any[];
  categoryName?: string;
}

const CRUST_OPTIONS = [
  { name: 'Tradicional', price: 0, label: 'Sem Borda' },
  { name: 'Catupiry', price: 8, label: 'Catupiry' },
  { name: 'Cheddar', price: 8, label: 'Cheddar' },
  { name: 'Cream Cheese', price: 10, label: 'Cream Cheese' },
  { name: 'Chocolate', price: 12, label: 'Chocolate' },
  { name: 'Doce de Leite', price: 12, label: 'Doce de Leite' },
];

export function ProductCard({ 
  id, 
  name, 
  description, 
  price, 
  imageUrl, 
  category, 
  isPromotion,
  promotionSize = 'all',
  hasMultipleSizes,
  priceSmall,
  priceMedium,
  priceLarge,
  allProducts = [],
  categoryName = ""
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [size, setSize] = useState('Média');
  const [crust, setCrust] = useState('Tradicional');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  
  // Lógica de Meio a Meio
  const [pizzaType, setPizzaType] = useState<'single' | 'half'>('single');
  const [secondFlavorId, setSecondFlavorId] = useState<string | null>(null);

  const isPizza = categoryName.toLowerCase().includes('pizza');

  const otherPizzas = useMemo(() => {
    return allProducts.filter(p => 
      p.id !== id && 
      p.categoryId === category &&
      p.isAvailable !== false
    );
  }, [allProducts, id, category]);

  const secondFlavor = useMemo(() => {
    return otherPizzas.find(p => p.id === secondFlavorId);
  }, [otherPizzas, secondFlavorId]);

  const getBasePrice = () => {
    let p1 = price;
    let p2 = 0;

    if (hasMultipleSizes) {
      if (size === 'Pequena') p1 = priceSmall || price;
      else if (size === 'Média') p1 = priceMedium || price;
      else if (size === 'Grande') p1 = priceLarge || price;
    }

    if (pizzaType === 'half' && secondFlavor) {
      p2 = secondFlavor.price;
      if (secondFlavor.hasMultipleSizes) {
        if (size === 'Pequena') p2 = secondFlavor.priceSmall || secondFlavor.price;
        else if (size === 'Média') p2 = secondFlavor.priceMedium || secondFlavor.price;
        else if (size === 'Grande') p2 = secondFlavor.priceLarge || secondFlavor.price;
      }
      // Preço da pizza meio a meio é o valor da mais cara
      return Math.max(p1, p2);
    }

    return p1;
  };

  const getCrustPrice = () => {
    const option = CRUST_OPTIONS.find(o => o.name === crust);
    return option?.price || 0;
  };

  const getPrice = () => {
    return getBasePrice() + getCrustPrice();
  };

  const isCurrentSizeOnPromotion = () => {
    if (pizzaType === 'half') return false; // Promoções geralmente não valem para meio a meio
    if (!isPromotion) return false;
    if (!hasMultipleSizes || promotionSize === 'all') return true;
    
    if (promotionSize === 'small' && size === 'Pequena') return true;
    if (promotionSize === 'medium' && size === 'Média') return true;
    if (promotionSize === 'large' && size === 'Grande') return true;
    
    return false;
  };

  const getOriginalPrice = () => {
    return getPrice() * 1.25;
  };

  const handleAddToCart = () => {
    const finalPrice = getPrice();
    const finalFlavors = pizzaType === 'half' && secondFlavor 
      ? [name, secondFlavor.name] 
      : [name];
    
    const finalName = pizzaType === 'half' && secondFlavor
      ? `Meio ${name} / Meio ${secondFlavor.name}`
      : name;

    addItem({
      id: `${id}-${size}-${crust}-${pizzaType}-${secondFlavorId || 'none'}`,
      name: finalName,
      price: finalPrice,
      quantity: quantity,
      size,
      crust,
      notes,
      imageUrl,
      flavors: finalFlavors
    });
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setQuantity(1);
    setNotes('');
    setPizzaType('single');
    setSecondFlavorId(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-white">
      <CardHeader 
        className="p-0 relative aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Image 
          src={imageUrl} 
          alt={name} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          data-ai-hint="pizza"
        />
        {isPromotion && (
          <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground font-black px-3 py-1 text-sm rounded-full shadow-lg border-2 border-white/20">
            PROMOÇÃO 🔥
          </Badge>
        )}
      </CardHeader>
      <CardContent 
        className="p-4 space-y-3 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-xl md:text-2xl font-black font-headline leading-tight text-black">{name}</h3>
          <div className="flex flex-col items-end shrink-0">
            {isCurrentSizeOnPromotion() && (
              <span className="text-sm md:text-base text-muted-foreground/60 line-through font-bold">
                R$ {getOriginalPrice().toFixed(2)}
              </span>
            )}
            <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">R$ {price.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 font-medium">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-lg font-black shadow-lg shadow-primary/20 transition-all active:scale-95 text-white">
              <Plus className="mr-2 h-6 w-6" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none p-0 overflow-hidden">
            <div className="relative aspect-video w-full shrink-0">
              <Image src={imageUrl} alt={name} fill className="object-cover" />
              {isPromotion && (
                <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground font-black px-4 py-1.5 rounded-full shadow-2xl border-2 border-white/30 text-sm">
                  PROMOÇÃO 🔥
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-8 flex-1">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <DialogTitle className="text-3xl md:text-4xl font-black text-foreground tracking-tighter flex-1 leading-tight">{name}</DialogTitle>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    {isCurrentSizeOnPromotion() && (
                      <p className="text-base text-muted-foreground/60 line-through font-bold">R$ {getOriginalPrice().toFixed(2)}</p>
                    )}
                    <p className="text-4xl md:text-5xl font-black text-primary leading-tight tracking-tighter">R$ {getPrice().toFixed(2)}</p>
                  </div>
                </div>
                {pizzaType === 'single' && (
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed">{description}</p>
                )}
              </div>

              {isPizza && (
                <div className="space-y-4 p-4 bg-primary/5 rounded-[2rem] border-2 border-primary/10">
                  <Label className="text-xl font-black text-primary flex items-center gap-2">
                    <PizzaIcon className="h-5 w-5" /> Tipo de Pizza
                  </Label>
                  <RadioGroup value={pizzaType} onValueChange={(v: any) => setPizzaType(v)} className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="single" id="t-single" className="sr-only" />
                      <Label htmlFor="t-single" className={`w-full text-center py-3 border-2 rounded-2xl cursor-pointer transition-all ${pizzaType === 'single' ? 'border-primary bg-primary text-white shadow-md' : 'border-muted bg-white hover:border-primary/50 text-foreground'}`}>
                        <span className="block font-black text-base">1 Sabor</span>
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="half" id="t-half" className="sr-only" />
                      <Label htmlFor="t-half" className={`w-full text-center py-3 border-2 rounded-2xl cursor-pointer transition-all ${pizzaType === 'half' ? 'border-primary bg-primary text-white shadow-md' : 'border-muted bg-white hover:border-primary/50 text-foreground'}`}>
                        <span className="block font-black text-base">2 Sabores</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {pizzaType === 'half' && (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-sm font-bold text-muted-foreground">Escolha o Segundo Sabor</Label>
                      <Select value={secondFlavorId || ""} onValueChange={setSecondFlavorId}>
                        <SelectTrigger className="h-12 rounded-xl border-2 bg-white text-black font-bold">
                          <SelectValue placeholder="Selecione um sabor..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-[250px]">
                          {otherPizzas.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="font-bold text-black py-3">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-start gap-2 bg-white/50 p-3 rounded-xl border border-dashed border-primary/20">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-muted-foreground leading-tight">
                          Dica: O valor da pizza meio a meio será baseado no sabor de maior valor para o tamanho selecionado.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasMultipleSizes && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-xl font-black text-foreground">Escolha o Tamanho</Label>
                    {isCurrentSizeOnPromotion() && (
                      <Badge variant="outline" className="border-primary text-primary text-[10px] font-black uppercase">
                        {promotionSize === 'small' ? 'Oferta na Broto' : promotionSize === 'medium' ? 'Oferta na Média' : 'Oferta na Grande'}
                      </Badge>
                    )}
                  </div>
                  <RadioGroup value={size} onValueChange={setSize} className="grid grid-cols-3 gap-3">
                    {['Pequena', 'Média', 'Grande'].map((s) => {
                      let sPrice = s === 'Pequena' ? priceSmall : s === 'Média' ? priceMedium : priceLarge;
                      if (pizzaType === 'half' && secondFlavor) {
                        const p2Price = s === 'Pequena' ? secondFlavor.priceSmall : s === 'Média' ? secondFlavor.priceMedium : secondFlavor.priceLarge;
                        sPrice = Math.max(sPrice || 0, p2Price || 0);
                      }
                      return (
                        <div key={s} className="flex flex-col items-center">
                          <RadioGroupItem value={s} id={`size-${s}`} className="sr-only" />
                          <Label htmlFor={`size-${s}`} className={`w-full text-center py-4 border-2 rounded-2xl cursor-pointer transition-all ${size === s ? 'border-primary bg-primary/10 text-primary shadow-md' : 'border-muted bg-white/50 hover:border-primary/50 text-foreground'}`}>
                            <span className="block font-black text-base">{s}</span>
                            <div className="flex flex-col items-center">
                              {pizzaType === 'single' && (promotionSize === 'all' || (promotionSize === 'small' && s === 'Pequena') || (promotionSize === 'medium' && s === 'Média') || (promotionSize === 'large' && s === 'Grande')) && isPromotion && (
                                <span className="text-[10px] line-through opacity-50 font-bold">R$ {((sPrice || price) * 1.25).toFixed(2)}</span>
                              )}
                              <span className="text-sm font-black opacity-80">R$ {sPrice?.toFixed(2)}</span>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-xl font-black text-foreground">Borda Recheada (Opcional)</Label>
                <RadioGroup value={crust} onValueChange={setCrust} className="grid grid-cols-2 gap-3">
                  {CRUST_OPTIONS.map((option) => (
                    <div key={option.name} className="flex flex-col items-center">
                      <RadioGroupItem value={option.name} id={`crust-${option.name}`} className="sr-only" />
                      <Label 
                        htmlFor={`crust-${option.name}`} 
                        className={`w-full text-center py-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col ${
                          crust === option.name 
                            ? 'border-primary bg-primary/10 text-primary shadow-md' 
                            : 'border-muted bg-white/50 hover:border-primary/50 text-foreground'
                        }`}
                      >
                        <span className="font-black text-base">{option.label}</span>
                        {option.price > 0 && (
                          <span className="text-xs font-black opacity-80">+ R$ {option.price.toFixed(2)}</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-xl font-black text-foreground">Observações</Label>
                <Textarea 
                  placeholder="Ex: Sem cebola, bem passada, s/ gergelim..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-2xl min-h-[120px] border-2 bg-[hsl(var(--field))] text-[hsl(var(--field-foreground))] font-medium placeholder:text-muted-foreground text-lg"
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-muted/30 rounded-[2rem] border-2 border-dashed">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 bg-background text-primary hover:bg-primary hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(Math.max(1, quantity - 1));
                  }}
                >
                  <Minus className="h-8 w-8" />
                </Button>
                <div className="text-center">
                  <span className="text-5xl font-black block text-foreground leading-none">{quantity}</span>
                  <span className="text-[10px] uppercase font-black opacity-40 text-foreground tracking-widest mt-1 block">Quantidade</span>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 bg-background text-primary hover:bg-primary hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(quantity + 1);
                  }}
                >
                  <Plus className="h-8 w-8" />
                </Button>
              </div>
            </div>

            <div className="p-6 border-t sticky bottom-0 z-20 bg-background/80 backdrop-blur-md">
              <Button 
                onClick={handleAddToCart} 
                disabled={pizzaType === 'half' && !secondFlavorId}
                className="w-full h-24 rounded-full text-2xl font-black bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 text-white transform transition active:scale-95 flex flex-col justify-center leading-tight disabled:grayscale"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">
                    {pizzaType === 'half' && !secondFlavorId ? 'Escolha o 2º sabor' : 'Confirmar Pedido'}
                  </span>
                  <div className="flex items-center gap-3">
                    {isCurrentSizeOnPromotion() && (
                      <span className="text-base line-through opacity-50 font-bold">R$ {(getOriginalPrice() * quantity).toFixed(2)}</span>
                    )}
                    <span className="text-3xl md:text-4xl font-black tracking-tighter">R$ {(getPrice() * quantity).toFixed(2)}</span>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
