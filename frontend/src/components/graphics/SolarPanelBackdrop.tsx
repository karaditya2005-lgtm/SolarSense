import React from 'react';

export interface SolarPanelBackdropProps {
  imageSrc?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SolarPanelBackdrop: React.FC<SolarPanelBackdropProps> = ({
  imageSrc,
  className = '',
  children,
}) => {
  const activeImage = imageSrc || import.meta.env.VITE_HERO_IMAGE || '/images/hero-solar.jpg';

  return (
    <div className={`relative overflow-hidden bg-slate-50 dark:bg-slate-950 select-none transition-colors duration-300 ${className}`}>
      {/* 1. Real Solar Panels Photographic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-1000 opacity-90 dark:opacity-60"
        style={{
          backgroundImage: `url(${activeImage})`,
        }}
      />

      {/* 2. Light / Dark Contrast Mask to Guarantee WCAG Legibility */}
      <div className="absolute inset-0 bg-white/75 dark:bg-slate-950/85 backdrop-blur-[0.5px] transition-colors duration-300" />

      {/* 3. Ambient Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-white/80 to-white/40 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/40 pointer-events-none transition-colors duration-300" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-white/70 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent pointer-events-none transition-colors duration-300" />

      {/* 4. Solar Emerald Light Leak Glow */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[340px] rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-35 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse, #10b981 0%, #059669 35%, rgba(16, 185, 129, 0) 75%)',
        }}
      />

      {/* 5. Edge Vignette for Crisp Focus */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 shadow-[inset_0_0_100px_40px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_0_160px_70px_rgba(2,6,23,0.96)]"
      />

      {/* 6. Foreground Content Slot */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
