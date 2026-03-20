import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-light-beige">
      <Header />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12">
        {children}
      </main>
      <footer className="py-16 border-t border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded flex items-center justify-center">
              <img src="/icon.avif" alt="Etihad Airways" className="h-7 w-7" />
            </div>
            <span className="text-sm font-black text-dark-brown uppercase tracking-widest">Etihad Airways Premium Support</span>
          </div>
          <div className="flex items-center gap-10">
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-primary-gold transition-premium">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-primary-gold transition-premium">Terms of Service</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-primary-gold transition-premium">Contact Us</a>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
            © 2026 Etihad Airways Flight Disruption Claims
          </p>
        </div>
      </footer>
    </div>
  );
};
