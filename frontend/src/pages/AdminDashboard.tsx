import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Search, Filter, ChevronRight, User, Plane, Loader2 } from 'lucide-react';
import { Claim, ClaimStatus } from '../types/index';
import { api } from '../services/api';
import { mapApiClaimListToClaims } from '../utils/claimMapper';
import { getStatusVariant } from '../utils/claimStatus';

export const AdminDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await api.getClaims();
        setClaims(mapApiClaimListToClaims(data));
      } catch (err) {
        console.error('Error fetching claims:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.passengerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-primary-gold animate-spin" />
        <p className="text-stone-500 font-medium">Loading claims database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark-brown tracking-tight uppercase">Admin Dashboard</h1>
          <p className="text-sm text-stone-500">Manage and review incoming flight disruption claims.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">{claims.length} Total Claims</Badge>
          <Badge variant="warning">{claims.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'UNDER_REVIEW').length} Pending Review</Badge>
        </div>
      </div>

      <Card className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by Case, PNR, or Name..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-light-beige text-sm outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-premium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <select
              className="rounded-lg border border-border bg-light-beige px-4 py-3 text-sm outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-premium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | 'ALL')}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Case Number</th>
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Passenger</th>
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Flight / PNR</th>
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount</th>
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className="border-b border-border hover:bg-light-beige/50 transition-premium cursor-pointer group"
                    onClick={() => navigate(`/admin/${claim.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className="text-sm font-black text-dark-brown tracking-tighter">{claim.caseNumber}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-stone-400" />
                        <span className="text-sm font-bold text-dark-brown">{claim.passengerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-xs font-bold text-dark-brown">
                          <Plane className="h-3 w-3 text-primary-gold" />
                          <span>{claim.flightDetails?.flightNumber}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{claim.pnr}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-black text-primary-gold">${claim.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-primary-gold transition-premium ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 text-sm italic">
                    No claims found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
