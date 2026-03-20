import React from 'react';
import { cn } from '../utils/cn';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex w-full items-center justify-between px-4 py-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-premium',
                index < currentStep
                  ? 'bg-primary-gold border-primary-gold text-white'
                  : index === currentStep
                  ? 'border-primary-gold text-primary-gold ring-4 ring-primary-gold/10'
                  : 'border-border text-stone-300'
              )}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : <span className="text-xs font-bold">{index + 1}</span>}
            </div>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em]',
                index <= currentStep ? 'text-dark-brown' : 'text-stone-300'
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-4 transition-premium',
                index < currentStep ? 'bg-primary-gold' : 'bg-border'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
