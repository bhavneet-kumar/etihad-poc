import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ChevronRight, Plane, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { Claim } from '../types/index';
import { api } from '../services/api';
import { mapApiClaimListToClaims } from '../utils/claimMapper';
import { getStatusVariant } from '../utils/claimStatus';

export const ClaimsDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await api.getClaims();
        setClaims(mapApiClaimListToClaims(data));
      } catch (err: unknown) {
        console.error('Error fetching claims:', err);
        setError(err instanceof Error ? err.message : 'Failed to load claims');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-primary-gold animate-spin" />
        <p className="text-stone-500 font-medium">Loading your claims...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-dark-brown tracking-tighter uppercase">My Claims</h1>
          <p className="text-stone-500 font-medium">Track the status of your disruption compensation requests.</p>
        </div>
        <Button onClick={() => navigate('/')} className="w-full md:w-auto">
          Submit New Claim
        </Button>
      </div>

      {claims.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {claims.map((claim) => (
            <Card 
              key={claim.id} 
              className="group hover:border-primary-gold transition-premium cursor-pointer p-0 overflow-hidden"
              onClick={() => navigate(`/claims/${claim.id}`)}
            >
              <div className="flex flex-col md:flex-row">
                <div className="p-8 flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Case Number</p>
                      <p className="text-xl font-black text-dark-brown tracking-tight">{claim.caseNumber}</p>
                    </div>
                    <Badge variant={getStatusVariant(claim.status)}>{claim.status.replace(/_/g, ' ')}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-400">
                        <Plane className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Flight</span>
                      </div>
                      <p className="text-sm font-bold text-dark-brown">{claim.flightDetails?.flightNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-400">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Submitted</span>
                      </div>
                      <p className="text-sm font-bold text-dark-brown">{claim.submissionDate.split(',')[0]}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-400">
                        <CreditCard className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Amount</span>
                      </div>
                      <p className="text-sm font-bold text-primary-gold">${claim.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-stone-400">
                        <span className="text-[10px] font-bold uppercase tracking-widest">PNR</span>
                      </div>
                      <p className="text-sm font-bold text-dark-brown">{claim.pnr}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-light-beige px-6 flex items-center justify-center group-hover:bg-primary-gold transition-premium">
                  <ChevronRight className="h-6 w-6 text-stone-300 group-hover:text-white transition-premium" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-24 text-center space-y-6">
          <div className="h-20 w-20 bg-light-beige rounded-full flex items-center justify-center mx-auto">
            <Plane className="h-10 w-10 text-stone-300" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-dark-brown">No claims found</h3>
            <p className="text-stone-500 max-w-xs mx-auto">You haven't submitted any disruption claims yet.</p>
          </div>
          <Button onClick={() => navigate('/')} variant="secondary">
            Start Your First Claim
          </Button>
        </Card>
      )}
    </div>
  );
};
