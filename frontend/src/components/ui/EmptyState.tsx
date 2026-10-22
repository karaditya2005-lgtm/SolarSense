import React from 'react';
import { SunMedium } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-panel p-8 sm:p-12 rounded-xl flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-solar-500/10 border border-solar-500/20 text-solar-400 flex items-center justify-center mb-4">
        {icon || <SunMedium className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mt-1.5 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
