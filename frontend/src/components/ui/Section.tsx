import React from 'react';

export interface SectionProps {
  id?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  centered?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  title,
  subtitle,
  centered = false,
  className = '',
  containerClassName = '',
  children,
}) => {
  const hasHeader = Boolean(title || subtitle);

  return (
    <section id={id} className={`py-16 md:py-24 relative overflow-hidden ${className}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${containerClassName}`}>
        {hasHeader && (
          <div className={`mb-12 md:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
            {title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};
