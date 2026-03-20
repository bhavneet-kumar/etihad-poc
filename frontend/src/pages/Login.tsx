import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Plane } from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80';

export const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [roleHint, setRoleHint] = useState<'customer' | 'admin'>('customer');
  const [email, setEmail] = useState('customer@test.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : from && from !== '/login' ? from : '/', { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  React.useEffect(() => {
    setEmail(roleHint === 'customer' ? 'customer@test.com' : 'admin@test.com');
  }, [roleHint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const loggedIn = JSON.parse(localStorage.getItem('etihad_auth_user') || '{}');
      if (loggedIn.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from && from.startsWith('/admin') ? '/' : from || '/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-light-beige">
      <div className="relative hidden md:flex md:w-1/2 min-h-[40vh] md:min-h-screen">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-brown/90 via-dark-brown/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Plane className="h-8 w-8 text-primary-gold" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.25em] text-primary-gold">Etihad Airways</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Welcome to Etihad Claims Portal
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-relaxed">
            Submit and track flight disruption claims with a premium, secure experience.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16 lg:px-24 bg-white md:bg-light-beige">
        <div className="mx-auto w-full max-w-md space-y-10">
          <div className="md:hidden text-center space-y-2">
            <h1 className="text-2xl font-black text-dark-brown">Etihad Claims Portal</h1>
            <p className="text-sm text-stone-500">Sign in to continue</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Account type</p>
            <div className="flex rounded-xl border border-border p-1 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setRoleHint('customer')}
                className={`flex-1 rounded-lg py-3 text-xs font-black uppercase tracking-widest transition-premium ${
                  roleHint === 'customer'
                    ? 'bg-primary-gold text-dark-brown shadow-sm'
                    : 'text-stone-500 hover:text-dark-brown'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRoleHint('admin')}
                className={`flex-1 rounded-lg py-3 text-xs font-black uppercase tracking-widest transition-premium ${
                  roleHint === 'admin'
                    ? 'bg-primary-gold text-dark-brown shadow-sm'
                    : 'text-stone-500 hover:text-dark-brown'
                }`}
              >
                Admin
              </button>
            </div>
            <p className="mt-2 text-[10px] text-stone-400">
              For convenience only — your access is determined by your account credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-[10px] text-stone-400">
            POC demo: <span className="font-mono text-stone-600">customer@test.com</span> /{' '}
            <span className="font-mono text-stone-600">admin@test.com</span> — password{' '}
            <span className="font-mono">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
};
