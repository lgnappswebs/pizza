
"use client"

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/cart-store';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isPromotion?: boolean;
  hasMultipleSizes?: boolean;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
}

export function ProductCard({ 
  id, 
  name, 
  description, 
  price, 
  imageUrl, 
  category, 
  isPromotion,
  hasMultipleSizes,
  priceSmall,
  priceMedium,
  priceLarge 
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [size, setSize] = useState('Média');
  const [crust, setCrust] = useState('Tradicional');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);

  const getPrice = () => {
    if (!hasMultipleSizes) return price;
    if (size === 'Pequena') return priceSmall || price;
    if (size === 'Média') return priceMedium || price;
    if (size === 'Grande') return priceLarge || price;
    return price;
  };

  const handleAddToCart = () => {
    const finalPrice = getPrice();
    addItem({
      id: `${id}-${size}-${crust}`,
      name,
      price: finalPrice,
      quantity: quantity,
      size,
      crust,
      notes,
      imageUrl
    });
    setOpen(false);
    setQuantity(1);
    setNotes('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setQuantity(1);
      setNotes('');
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
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
          <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground font-bold px-3 py-1 text-sm rounded-full">
            PROMOÇÃO 🔥
          </Badge>
        )}
      </CardHeader>
      <CardContent 
        className="p-4 space-y-2 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold font-headline leading-tight">{name}</h3>
          <span className="text-xl font-bold text-primary">R$ {getPrice().toFixed(2)}</span>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-lg font-bold py-6">
              <Plus className="mr-2 h-5 w-5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden mt-4">
                <Image src={imageUrl} alt={name} fill className="object-cover" />
              </div>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {hasMultipleSizes && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Tamanho</Label>
                  <RadioGroup value={size} onValueChange={setSize} className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="Pequena" id="broto" className="sr-only" />
                      <Label htmlFor="broto" className={`w-full text-center py-3 border-2 rounded-xl cursor-pointer transition-colors ${size === 'Pequena' ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}>
                        <span className="block font-bold">Pequena</span>
                        <span className="text-[10px] opacity-70">R$ {priceSmall?.toFixed(2)}</span>
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="Média" id="media" className="sr-only" />
                      <Label htmlFor="media" className={`w-full text-center py-3 border-2 rounded-xl cursor-pointer transition-colors ${size === 'Média' ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}>
                        <span className="block font-bold">Média</span>
                        <span className="text-[10px] opacity-70">R$ {priceMedium?.toFixed(2)}</span>
                      </Label>
                    </div>
                    <div className="flex flex-col items-center">
                      <RadioGroupItem value="Grande" id="grande" className="sr-only" />
                      <Label htmlFor="grande" className={`w-full text-center py-3 border-2 rounded-xl cursor-pointer transition-colors ${size === 'Grande' ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}>
                        <span className="block font-bold">Grande</span>
                        <span className="text-[10px] opacity-70">R$ {priceLarge?.toFixed(2)}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Borda Recheada</Label>
                <RadioGroup value={crust} onValueChange={setCrust} className="grid grid-cols-2 gap-2">
                   <div className="flex flex-col items-center">
                    <RadioGroupItem value="Tradicional" id="trad" className="sr-only" />
                    <Label htmlFor="trad" className={`w-full text-center py-3 border-2 rounded-xl cursor-pointer transition-colors ${crust === 'Tradicional' ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}>
                      Sem Borda
                    </Label>
                  </div>
                  <div className="flex flex-col items-center">
                    <RadioGroupItem value="Catupiry" id="cat" className="sr-only" />
                    <Label htmlFor="cat" className={`w-full text-center py-3 border-2 rounded-xl cursor-pointer transition-colors ${crust === 'Catupiry' ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}>
                      Catupiry
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Quantidade</Label>
                <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full border-2 bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                  >
                    <Minus className="h-6 w-6 text-primary" />
                  </Button>
                  <span className="text-3xl font-black w-12 text-center">{quantity}</span>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full border-2 bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(quantity + 1);
                    }}
                  >
                    <Plus className="h-6 w-6 text-primary" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Observações</Label>
                <Textarea 
                  placeholder="Ex: Sem cebola, bem passada..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddToCart} className="w-full rounded-full py-6 text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Confirmar • R$ {(getPrice() * quantity).toFixed(2)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
