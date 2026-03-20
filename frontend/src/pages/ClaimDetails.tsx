import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Timeline } from '../components/Timeline';
import {
  ChevronLeft,
  Plane,
  User,
  FileText,
  CreditCard,
  Clock,
  HelpCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Claim } from '../types/index';
import { api } from '../services/api';
import { mapApiClaimDetailToClaim } from '../utils/claimMapper';
import { getStatusVariant, getStatusIcon } from '../utils/claimStatus';
import { ReceiptImageModal } from '../components/ReceiptImageModal';

export const ClaimDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [receiptImageSrc, setReceiptImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaimDetail = async () => {
      try {
        if (!id) return;
        const data = await api.getClaimDetail(id);
        setClaim(mapApiClaimDetailToClaim(data));
      } catch (err: unknown) {
        console.error('Error fetching claim detail:', err);
        setError(err instanceof Error ? err.message : 'Failed to load claim');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchClaimDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-primary-gold animate-spin" />
        <p className="text-stone-500 font-medium">Loading claim details...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#3D2314]">Claim not found</h1>
        <Button onClick={() => navigate('/claims')} className="mt-4">Back to My Claims</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate('/claims')}
        className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-primary-gold transition-premium"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to My Claims</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-dark-brown tracking-tight">{claim.caseNumber}</h1>
                <Badge variant={getStatusVariant(claim.status)}>{claim.status.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-sm text-stone-500">Submitted on {claim.submissionDate}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(claim.status)}
              <span className="text-sm font-bold text-dark-brown uppercase tracking-widest">Status: {claim.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <User className="h-5 w-5 text-primary-gold" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark-brown">Passenger Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Name</p>
                  <p className="text-sm font-bold text-dark-brown">{claim.passengerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Email</p>
                  <p className="text-sm font-bold text-dark-brown">{claim.email}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Plane className="h-5 w-5 text-primary-gold" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark-brown">Flight Information</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Flight</p>
                    <p className="text-sm font-bold text-dark-brown">{claim.flightDetails?.flightNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">PNR</p>
                    <p className="text-sm font-bold text-dark-brown">{claim.pnr}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Route</p>
                  <p className="text-sm font-bold text-dark-brown">
                    {claim.flightDetails?.origin || 'N/A'} → {claim.flightDetails?.destination || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Departure date</p>
                  <p className="text-sm font-bold text-dark-brown">{claim.flightDetails?.departureDate || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <CreditCard className="h-5 w-5 text-primary-gold" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark-brown">Expense Details</h3>
            </div>
            <div className="space-y-4">
              {claim.expenses.map((exp) => {
                const receiptSrc = exp.receiptUrl || `https://picsum.photos/seed/${encodeURIComponent(exp.merchant.replace(/\s/g, ''))}/600/800`;
                return (
                  <div key={exp.id} className="flex items-center justify-between p-4 bg-light-beige rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-dark-brown shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark-brown">{exp.merchant}</p>
                        <p className="text-xs text-stone-400">{exp.category} • {exp.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-dark-brown">${exp.amount.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setReceiptImageSrc(receiptSrc); }}
                        className="h-9 w-9 rounded-lg bg-white border border-border flex items-center justify-center text-primary-gold hover:bg-primary-gold/10 transition-premium"
                        title="View receipt"
                        aria-label={`View receipt for ${exp.merchant}`}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="pt-6 border-t border-border flex justify-between items-center">
                <span className="text-lg font-bold text-dark-brown">Total Reimbursement</span>
                <span className="text-3xl font-black text-primary-gold">${claim.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Timeline & Help */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="space-y-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Clock className="h-5 w-5 text-primary-gold" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark-brown">Claim Timeline</h3>
            </div>
            <Timeline steps={claim.timeline} />
          </Card>

          <ReceiptImageModal src={receiptImageSrc} onClose={() => setReceiptImageSrc(null)} />

          <Card className="space-y-6 bg-white border-primary-gold/20">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-primary-gold" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark-brown">Need Help?</h3>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              If you have questions about your claim or need to provide additional information, please contact our support team.
            </p>
            <Button variant="tertiary" className="w-full text-xs">
              Contact Support
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
