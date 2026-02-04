
"use client"

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEffect } from 'react';

/**
 * Componente utilitário que injeta as cores personalizadas do banco de dados
 * no :root do CSS via variáveis. Também controla o fundo do app.
 */
export function ThemeInjected() {
  const firestore = useFirestore();
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  // Função para converter Hex para HSL (Tailwind usa HSL)
  const hexToHsl = (hex: string) => {
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

  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;
    
    // Aplicar Cor Principal
    if (config.primaryColor) {
      root.style.setProperty('--primary', hexToHsl(config.primaryColor));
      root.style.setProperty('--ring', hexToHsl(config.primaryColor));
    }

    // Aplicar Cor Secundária (Accent)
    if (config.secondaryColor) {
      root.style.setProperty('--secondary', hexToHsl(config.secondaryColor));
      root.style.setProperty('--accent', hexToHsl(config.secondaryColor));
    }

    // Aplicar Cor de Fundo do Body
    if (config.appBackgroundType === 'color' && config.backgroundColor) {
      root.style.setProperty('--background', hexToHsl(config.backgroundColor));
    } else if (config.appBackgroundType === 'image' || config.appBackgroundType === 'pattern') {
      root.style.setProperty('--background', '0 0% 100%'); // Fundo branco base para imagens/padrões
    }

  }, [config]);

  // Renderizar o fundo dinâmico
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {config?.appBackgroundType === 'pattern' && (
        <div className="absolute inset-0 bg-food-pattern opacity-[0.05]"></div>
      )}
      {config?.appBackgroundType === 'image' && config.appBackgroundImageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.1]" 
          style={{ backgroundImage: `url(${config.appBackgroundImageUrl})` }}
        ></div>
      )}
    </div>
  );
}
