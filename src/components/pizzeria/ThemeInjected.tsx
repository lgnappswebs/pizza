
"use client"

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Componente utilitário que injeta as cores personalizadas do banco de dados
 * no :root do CSS via variáveis. Controla o contraste de fontes, cards e inputs.
 */
export function ThemeInjected() {
  const firestore = useFirestore();
  const pathname = usePathname();
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  // Função para converter Hex para HSL (Tailwind usa HSL)
  const hexToHsl = (hex: string) => {
    if (!hex) return "0 0% 100%";
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const getLuminance = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (!hex) return 1;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };

  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;
    
    // Injeção de cores primárias e secundárias
    if (config.primaryColor) {
      root.style.setProperty('--primary', hexToHsl(config.primaryColor));
      root.style.setProperty('--ring', hexToHsl(config.primaryColor));
      root.style.setProperty('--primary-foreground', getLuminance(config.primaryColor) < 0.6 ? '0 0% 100%' : '0 0% 0%');
    }

    if (config.secondaryColor) {
      root.style.setProperty('--secondary', hexToHsl(config.secondaryColor));
      root.style.setProperty('--accent', hexToHsl(config.secondaryColor));
      root.style.setProperty('--secondary-foreground', getLuminance(config.secondaryColor) < 0.6 ? '0 0% 100%' : '0 0% 0%');
    }

    // Lógica de Fundo e Contraste Automático
    let backgroundLuminance = 1; // Default branco
    
    if (config.appBackgroundType === 'color' && config.backgroundColor) {
      root.style.setProperty('--background', hexToHsl(config.backgroundColor));
      backgroundLuminance = getLuminance(config.backgroundColor);
      root.style.removeProperty('--app-bg-image');
    } else if (config.appBackgroundType === 'image' && config.appBackgroundImageUrl) {
      root.style.setProperty('--background', '0 0% 100%'); // Base branca por segurança
      root.style.setProperty('--app-bg-image', `url(${config.appBackgroundImageUrl})`);
      backgroundLuminance = 0.2; // Assumimos modo dark-friendly para imagens para forçar destaque
    } else {
      root.style.setProperty('--background', '0 0% 100%');
      root.style.removeProperty('--app-bg-image');
      backgroundLuminance = 1;
    }

    // Se o fundo for ESCURO (< 0.5 de luminância)
    if (backgroundLuminance < 0.5) {
      // Fontes e textos principais tornam-se BRANCOS
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--muted-foreground', '0 0% 80%');
      
      // Cards, Inputs e Modais permanecem BRANCOS para destaque (High Contrast)
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 3.9%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 3.9%');
      
      // Campos de formulário (Inputs) sempre brancos com texto preto no modo dark
      root.style.setProperty('--field', '0 0% 100%');
      root.style.setProperty('--field-foreground', '0 0% 3.9%');
      root.style.setProperty('--input', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 100% / 30%');
      root.style.setProperty('--muted', '0 0% 90%');
    } else {
      // Modo Claro Padrão
      root.style.setProperty('--foreground', '0 0% 3.9%');
      root.style.setProperty('--muted-foreground', '0 0% 45.1%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 3.9%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 3.9%');
      root.style.setProperty('--field', '0 0% 100%');
      root.style.setProperty('--field-foreground', '0 0% 3.9%');
      root.style.setProperty('--input', '0 0% 89.8%');
      root.style.setProperty('--border', '0 0% 89.8%');
      root.style.setProperty('--muted', '0 0% 96.1%');
    }

  }, [config]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {config?.appBackgroundType === 'pattern' && (
        <div className="absolute inset-0 bg-food-pattern opacity-[0.05]"></div>
      )}
      {config?.appBackgroundType === 'image' && config.appBackgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500" 
          style={{ 
            backgroundImage: `url(${config.appBackgroundImageUrl})`,
            opacity: (pathname === '/menu' || pathname === '/account' || pathname.startsWith('/admin')) ? 0.2 : 1.0
          }}
        ></div>
      )}
    </div>
  );
}
