
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { MapPin, Phone, Mail, Instagram, Facebook, Music2 } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const firestore = useFirestore();
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  if (!config) return null;

  const whatsappForLink = (config.whatsappNumber || config.contactPhone || "").replace(/\D/g, "");
  const whatsappLink = whatsappForLink 
    ? `https://wa.me/${whatsappForLink}?text=${encodeURIComponent(config.whatsappAutoMessage || 'Olá! Gostaria de tirar uma dúvida.')}`
    : null;

  return (
    <footer className="bg-white border-t py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Endereço */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">Onde Estamos</h3>
            <div className="flex items-start justify-center md:justify-start gap-3 text-muted-foreground">
              <div className="bg-primary/10 p-2 rounded-full shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg leading-relaxed">{config.address || "Endereço não configurado"}</p>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">Contato</h3>
            <div className="space-y-6">
              {whatsappLink && (
                <Link 
                  href={whatsappLink}
                  target="_blank"
                  className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground hover:text-primary transition-all group"
                >
                  <div className="bg-green-500/10 p-3 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm">
                    <Phone className="h-7 w-7 shrink-0" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-black opacity-60 tracking-widest">WhatsApp</p>
                    <p className="text-xl font-black">{config.contactPhone || config.whatsappNumber || "(00) 00000-0000"}</p>
                  </div>
                </Link>
              )}
              {config.contactEmail && (
                <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                  <div className="bg-muted p-3 rounded-2xl shadow-sm">
                    <Mail className="h-7 w-7 shrink-0" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-black opacity-60 tracking-widest">E-mail</p>
                    <p className="text-lg font-medium">{config.contactEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">Siga a Gente</h3>
            <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
              {config.instagramUrl && (
                <Link 
                  href={config.instagramUrl.startsWith('http') ? config.instagramUrl : `https://${config.instagramUrl}`} 
                  target="_blank" 
                  title="Instagram"
                  className="bg-muted hover:bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 hover:text-white text-muted-foreground p-4 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-md"
                >
                  <Instagram className="h-8 w-8" />
                </Link>
              )}
              {config.facebookUrl && (
                <Link 
                  href={config.facebookUrl.startsWith('http') ? config.facebookUrl : `https://${config.facebookUrl}`} 
                  target="_blank" 
                  title="Facebook"
                  className="bg-muted hover:bg-[#1877F2] hover:text-white text-muted-foreground p-4 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-md"
                >
                  <Facebook className="h-8 w-8" />
                </Link>
              )}
              {config.tiktokUrl && (
                <Link 
                  href={config.tiktokUrl.startsWith('http') ? config.tiktokUrl : `https://${config.tiktokUrl}`} 
                  target="_blank" 
                  title="TikTok"
                  className="bg-muted hover:bg-black hover:text-white text-muted-foreground p-4 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-md"
                >
                  <Music2 className="h-8 w-8" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t text-center">
          <p className="text-muted-foreground font-medium">© {new Date().getFullYear()} <span className="font-black text-primary uppercase">{config.restaurantName || "PizzApp"}</span></p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 mt-3 font-bold">O sabor que você merece, na velocidade que você precisa</p>
        </div>
      </div>
    </footer>
  );
}
