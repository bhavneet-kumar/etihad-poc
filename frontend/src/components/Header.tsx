import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { LayoutDashboard, PlusCircle, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/90 backdrop-blur-md transition-premium">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg transition-premium group-hover:scale-105">
            <img src="/icon.avif" alt="Etihad Airways" className="h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-dark-brown uppercase leading-none">ETIHAD</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-gold mt-1">Airways</span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6">
          {isCustomer && (
            <>
              <Link to="/claims" className="hidden md:block">
                <Button variant="tertiary" className="gap-2 text-xs uppercase tracking-widest font-black">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>My Claims</span>
                </Button>
              </Link>
              {location.pathname !== '/' && (
                <Link to="/">
                  <Button variant="primary" className="gap-2 text-xs uppercase tracking-widest font-black">
                    <PlusCircle className="h-4 w-4" />
                    <span>Register Claim</span>
                  </Button>
                </Link>
              )}
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className="hidden md:block">
              <Button variant="tertiary" className="gap-2 text-xs uppercase tracking-widest font-black">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleLogout}
            className="gap-2 text-xs uppercase tracking-widest font-black"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};
