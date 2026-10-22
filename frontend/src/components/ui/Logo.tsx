import React from 'react';
import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  linkTo?: string | null;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  withText = true,
  linkTo = '/',
  className = '',
}) => {
  const iconSizeMap = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const sunSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <div
        className={`${iconSizeMap[size]} bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200 shrink-0`}
      >
        <Sun className={`${sunSizeMap[size]} text-white stroke-[2.5]`} />
      </div>
      {withText && (
        <span className={`${textSizeMap[size]} font-bold font-['Outfit'] tracking-tight text-slate-900 dark:text-white flex items-center gap-1`}>
          Solar<span className="text-emerald-600 dark:text-emerald-400">Sense</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
};
