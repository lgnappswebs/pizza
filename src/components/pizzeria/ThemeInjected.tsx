
"use client"

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';

export function ThemeInjected() {
  const firestore = useFirestore();
  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  const hexToHsl = (hex: string) => {
    if (!hex) return "0 0% 100%";
    let r = 0, g = 0, b = 0;
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
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    } else { h = s = 0; }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    if (!config) return;
    const root = document.documentElement;
    if (config.primaryColor) {
      root.style.setProperty('--primary', hexToHsl(config.primaryColor));
      root.style.setProperty('--ring', hexToHsl(config.primaryColor));
    }
    if (config.secondaryColor) {
      root.style.setProperty('--secondary', hexToHsl(config.secondaryColor));
      root.style.setProperty('--accent', hexToHsl(config.secondaryColor));
    }
    if (config.appBackgroundType === 'color' && config.backgroundColor) {
      root.style.setProperty('--background', hexToHsl(config.backgroundColor));
    } else {
      root.style.setProperty('--background', '0 0% 100%');
    }
    if (config.appBackgroundImageUrl) root.style.setProperty('--app-bg-image', `url(${config.appBackgroundImageUrl})`);
    root.style.setProperty('--app-pattern-opacity', config.appBackgroundType === 'pattern' ? '0.05' : '0');
    root.style.setProperty('--app-image-opacity', config.appBackgroundType === 'image' ? '0.4' : '0');
  }, [config]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {config?.appBackgroundType === 'pattern' && <div className="absolute inset-0 bg-food-pattern opacity-[0.05]"></div>}
      {config?.appBackgroundType === 'image' && config.appBackgroundImageUrl && (
        <div className="absolute inset-0 bg-cover bg-center transition-opacity" style={{ backgroundImage: `url(${config.appBackgroundImageUrl})`, opacity: 0.4 }}></div>
      )}
    </div>
  );
}
