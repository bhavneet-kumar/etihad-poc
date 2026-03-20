import React from 'react';
import { cn } from '../utils/cn';
import { Check, Circle } from 'lucide-react';

interface TimelineStepProps {
  label: string;
  timestamp: string;
  status: 'completed' | 'active' | 'pending';
}

export const Timeline: React.FC<{ steps: TimelineStepProps[] }> = ({ steps }) => {
  return (
    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-6 relative">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center border-2 z-10 bg-white transition-premium',
              step.status === 'completed'
                ? 'border-primary-gold bg-primary-gold text-white'
                : step.status === 'active'
                ? 'border-primary-gold text-primary-gold ring-4 ring-primary-gold/10'
                : 'border-border text-stone-300'
            )}
          >
            {step.status === 'completed' ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5 fill-current" />}
          </div>
          <div className="flex flex-col pt-1">
            <span className={cn('text-sm font-bold uppercase tracking-widest', step.status === 'pending' ? 'text-stone-400' : 'text-dark-brown')}>
              {step.label}
            </span>
            <span className="text-xs text-stone-400 font-medium">{step.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
