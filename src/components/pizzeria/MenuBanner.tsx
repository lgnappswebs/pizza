
"use client"

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MenuBannerProps {
  banner: {
    id: string;
    title?: string;
    description?: string;
    imageUrl: string;
    textPosition?: string;
    linkCategoryId?: string;
  };
  onBannerClick?: (categoryId: string) => void;
}

export function MenuBanner({ banner, onBannerClick }: MenuBannerProps) {
  const getPositionClasses = (pos?: string) => {
    switch (pos) {
      case 'top-left': return 'items-start justify-start text-left';
      case 'top-center': return 'items-center justify-start text-center';
      case 'center': return 'items-center justify-center text-center';
      case 'bottom-left': return 'items-start justify-end text-left';
      case 'bottom-center': return 'items-center justify-end text-center';
      default: return 'items-center justify-center text-center';
    }
  };

  const handleClick = () => {
    if (banner.linkCategoryId && banner.linkCategoryId !== 'none' && onBannerClick) {
      onBannerClick(banner.linkCategoryId);
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full aspect-[21/9] md:aspect-[4/1] rounded-[2rem] overflow-hidden shadow-xl group",
        banner.linkCategoryId !== 'none' ? "cursor-pointer hover:scale-[1.01] transition-transform" : ""
      )}
      onClick={handleClick}
    >
      <Image 
        src={banner.imageUrl} 
        alt={banner.title || "Promoção"} 
        fill 
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority
      />
      <div className={cn(
        "absolute inset-0 bg-black/40 p-6 md:p-10 flex flex-col",
        getPositionClasses(banner.textPosition)
      )}>
        <div className="max-w-3xl">
          {banner.title && (
            <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-2 md:mb-3 uppercase tracking-tighter">
              {banner.title}
            </h2>
          )}
          {banner.description && (
            <p className="text-sm md:text-xl lg:text-2xl text-white/95 font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight">
              {banner.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
