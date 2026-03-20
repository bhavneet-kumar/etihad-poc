import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Claim } from '../types/index';
import { api } from '../services/api';
import { mapApiClaimListToClaims } from '../utils/claimMapper';

interface ClaimContextType {
  currentClaim: Partial<Claim>;
  setCurrentClaim: React.Dispatch<React.SetStateAction<Partial<Claim>>>;
  claimsList: Claim[];
  setClaimsList: React.Dispatch<React.SetStateAction<Claim[]>>;
  addClaim: (claim: Claim) => void;
  getClaimById: (id: string) => Promise<Claim | undefined>;
  refreshClaims: () => Promise<void>;
  submitClaimWithReceipts: (
    files: File[],
    meta: {
      pnr: string;
      email: string;
      passengerName: string;
      phone: string;
      flightDetails: {
        flightNumber: string;
        origin?: string;
        destination?: string;
        departureDate: string;
        status?: string;
      };
    }
  ) => Promise<{
    success: boolean;
    caseNumber?: string | null;
    status?: string | null;
    errors?: string[];
    estimatedProcessingDays: number;
    submissionDate: string;
    totalAmount: number;
    warnings: string[];
    expenseCount: number;
  }>;
}

const ClaimContext = createContext<ClaimContextType | undefined>(undefined);

export const ClaimProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentClaim, setCurrentClaim] = useState<Partial<Claim>>({
    expenses: [],
    totalAmount: 0,
    status: 'SUBMITTED',
  });

  const [claimsList, setClaimsList] = useState<Claim[]>([]);

  const refreshClaims = async () => {
    try {
      const raw = await api.getClaims();
      setClaimsList(mapApiClaimListToClaims(raw));
    } catch (error) {
      console.error('Failed to refresh claims:', error);
    }
  };

  useEffect(() => {
    refreshClaims();
  }, []);

  const submitClaimWithReceipts = async (
    files: File[],
    meta: {
      pnr: string;
      email: string;
      passengerName: string;
      phone: string;
      flightDetails: {
        flightNumber: string;
        origin?: string;
        destination?: string;
        departureDate: string;
        status?: string;
      };
    }
  ) => {
    const result = await api.submitClaimWithReceipts(files, meta);
    await refreshClaims();
    setCurrentClaim({
      expenses: [],
      totalAmount: 0,
      status: 'SUBMITTED',
    });
    return result;
  };

  const addClaim = (claim: Claim) => {
    setClaimsList((prev) => [claim, ...prev]);
  };

  const getClaimById = async (id: string) => {
    try {
      const data = await api.getClaimDetail(id);
      const { mapApiClaimDetailToClaim } = await import('../utils/claimMapper');
      return mapApiClaimDetailToClaim(data);
    } catch (error) {
      console.error('Failed to get claim by id:', error);
      return undefined;
    }
  };

  return (
    <ClaimContext.Provider
      value={{
        currentClaim,
        setCurrentClaim,
        claimsList,
        setClaimsList,
        addClaim,
        getClaimById,
        refreshClaims,
        submitClaimWithReceipts,
      }}
    >
      {children}
    </ClaimContext.Provider>
  );
};

export const useClaim = () => {
  const context = useContext(ClaimContext);
  if (!context) {
    throw new Error('useClaim must be used within a ClaimProvider');
  }
  return context;
};
