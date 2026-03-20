import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useClaim } from '../context/ClaimContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Stepper } from '../components/Stepper';
import { Upload } from '../components/Upload';
import { api } from '../services/api';
import { 
  Plane, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Info
} from 'lucide-react';
import { Expense, FlightDetails } from '../types/index';

const STEPS = ['Welcome', 'PNR Validation', 'Expense Entry', 'Review', 'Confirmation'];

const bandToConfidence = (b: string): 'High' | 'Medium' | 'Low' => {
  const u = b.toUpperCase();
  if (u === 'HIGH') return 'High';
  if (u === 'MEDIUM') return 'Medium';
  return 'Low';
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentClaim, setCurrentClaim, submitClaimWithReceipts } = useClaim();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user?.role, navigate]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const validateBookingStep = async () => {
    if (!currentClaim.pnr?.trim() || !currentClaim.lastName?.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.validateBooking(currentClaim.pnr.trim(), currentClaim.lastName.trim());
      if (!data.success) throw new Error(data.errors?.[0] || 'Validation failed');
      setCurrentClaim((prev) => ({
        ...prev,
        flightDetails: {
          ...(data.flightDetails as FlightDetails),
          origin: (data.flightDetails as FlightDetails)?.origin || 'N/A',
          destination: (data.flightDetails as FlightDetails)?.destination || 'N/A',
        },
        passengerName: data.passengerName,
      }));
      handleNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 0) return;
    setReceiptFiles((prev) => [...prev, ...files]);
  };

  const removeReceiptFile = (index: number) => {
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const goToReview = async () => {
    if (receiptFiles.length === 0) return;
    setIsLoading(true);
    setError(null);
    setPreviewWarnings([]);
    try {
      const data = await api.previewReceipts(receiptFiles);
      if (!data.success) throw new Error(data.errors?.[0] || 'Preview failed');
      const mapped: Expense[] = data.expenses.map((e, i) => ({
        id: `preview-${i}-${e.fileName}`,
        category: e.category,
        amount: e.amount,
        date: e.date,
        merchant: e.merchantName,
        confidence: bandToConfidence(e.confidence_band),
        fileName: e.fileName,
      }));
      setCurrentClaim((prev) => ({
        ...prev,
        expenses: mapped,
        totalAmount: data.totalAmount,
      }));
      setPreviewWarnings(data.warnings || []);
      handleNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not analyze receipts');
    } finally {
      setIsLoading(false);
    }
  };

  const [submissionResult, setSubmissionResult] = useState<{
    caseNumber: string;
    submissionDate: string;
    totalAmount: number;
    status: string;
    estimatedProcessingDays: number;
    warnings: string[];
  } | null>(null);

  const handleSubmit = async () => {
    if (!currentClaim.flightDetails || !currentClaim.pnr || !user?.email) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitClaimWithReceipts(receiptFiles, {
        pnr: currentClaim.pnr,
        email: user.email,
        passengerName: currentClaim.passengerName || 'Passenger',
        phone: currentClaim.phone || '',
        flightDetails: currentClaim.flightDetails,
      });
      if (!result.success) throw new Error(result.errors?.[0] || 'Submit failed');

      setReceiptFiles([]);
      setSubmissionResult({
        caseNumber: result.caseNumber ?? '',
        submissionDate: result.submissionDate ?? '',
        totalAmount: result.totalAmount ?? 0,
        status: result.status ?? '',
        estimatedProcessingDays: result.estimatedProcessingDays ?? 7,
        warnings: result.warnings || [],
      });
      handleNext();
    } catch (err: unknown) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Stepper steps={STEPS} currentStep={step} />

      <div className="mt-12 min-h-[500px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-primary-gold shadow-md">
                  <Plane className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-dark-brown tracking-tight uppercase">Welcome to Etihad Airways</h1>
                <p className="text-stone-500 max-w-md mx-auto">
                  Submit your flight disruption claim in minutes. Our premium AI-powered system ensures fast processing and reliable results.
                </p>
              </div>
              <Button onClick={handleNext} className="w-full max-w-xs">
                Start My Claim
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <Card className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-dark-brown">Validate Your Booking</h2>
                  <p className="text-sm text-stone-500">Enter your 6-character booking reference (PNR) and last name to retrieve your flight details.</p>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Booking Reference (PNR)"
                    placeholder="e.g. ABC123"
                    value={currentClaim.pnr || ''}
                    onChange={(e) => setCurrentClaim({ ...currentClaim, pnr: e.target.value })}
                    error={error || undefined}
                  />
                  <Input
                    label="Last name"
                    placeholder="e.g. Smith"
                    value={currentClaim.lastName || ''}
                    onChange={(e) => setCurrentClaim({ ...currentClaim, lastName: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" onClick={handleBack} className="flex-1">Back</Button>
                  <Button
                    onClick={validateBookingStep}
                    isLoading={isLoading}
                    className="flex-1"
                    disabled={!currentClaim.pnr || !currentClaim.lastName}
                  >
                    Validate Booking
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-dark-brown">Expense Entry</h2>
                  <p className="text-sm text-stone-500">Upload your receipts for meals, transport, or accommodation.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Receipts</span>
                  <div className="text-2xl font-black text-primary-gold">{receiptFiles.length}</div>
                </div>
              </div>
              <p className="text-xs text-stone-500">
                Receipts are analyzed on the server when you continue. OCR, validation, and policy checks run only on submit.
              </p>

              <div className="grid gap-6">
                <Upload onFilesSelect={handleFilesSelect} isLoading={isLoading} />

                <div className="space-y-4">
                  {receiptFiles.map((file, index) => (
                    <Card key={`${file.name}-${index}`} className="flex items-center justify-between p-4 group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-light-beige flex items-center justify-center text-dark-brown">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-dark-brown">{file.name}</span>
                          <p className="text-xs text-stone-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReceiptFile(index)}
                        className="text-stone-300 hover:text-error transition-premium"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Card>
                  ))}
                  {receiptFiles.length === 0 && (
                    <div className="text-center py-12 border border-stone-100 rounded-lg">
                      <p className="text-sm text-stone-400">No receipts attached yet.</p>
                    </div>
                  )}
                </div>
              </div>
              {error && step === 2 && (
                <p className="text-sm text-error font-medium">{error}</p>
              )}

              <div className="flex gap-4">
                <Button variant="secondary" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={goToReview} className="flex-1" disabled={receiptFiles.length === 0} isLoading={isLoading}>
                  Review Claim
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold text-dark-brown">Review & Submit</h2>
                <p className="text-sm text-stone-500">Please verify all details before final submission.</p>
              </div>

              <div className="grid gap-6">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Flight Details</h3>
                    <Badge variant="success">Eligible</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Flight</p>
                      <p className="text-sm font-bold text-dark-brown">{currentClaim.flightDetails?.flightNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">PNR</p>
                      <p className="text-sm font-bold text-dark-brown">{currentClaim.pnr}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Route</p>
                      <p className="text-sm font-bold text-dark-brown">
                        {currentClaim.flightDetails?.origin || 'N/A'} → {currentClaim.flightDetails?.destination || 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Departure date</p>
                      <p className="text-sm font-bold text-dark-brown">{currentClaim.flightDetails?.departureDate || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-border pb-4">Expense Summary</h3>
                  <div className="space-y-3">
                    {currentClaim.expenses?.map((exp) => (
                      <div key={exp.id} className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">{exp.merchant} ({exp.category})</span>
                        <span className="font-bold text-dark-brown">${exp.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="font-bold text-dark-brown">Total Reimbursement</span>
                      <span className="text-xl font-black text-primary-gold">${currentClaim.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {previewWarnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-800 space-y-1">
                      {previewWarnings.map((w, i) => (
                        <p key={i}>{w}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Submitting runs full server-side OCR and policy checks. By submitting, you confirm the information is accurate.
                  </p>
                </div>
              </div>
              {error && step === 3 && (
                <p className="text-sm text-error font-medium text-center">{error}</p>
              )}

              <div className="flex gap-4">
                <Button variant="secondary" onClick={handleBack} className="flex-1">Back</Button>
                <Button 
                  onClick={handleSubmit} 
                  isLoading={isLoading} 
                  className="flex-1"
                >
                  Submit Claim
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 py-6"
            >
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-success">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-dark-brown uppercase">Claim Submitted</h1>
                  <p className="text-stone-500">Your claim has been received and is being processed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="space-y-4 bg-white border-primary-gold/20">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Case Number</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-dark-brown tracking-tighter">
                        {submissionResult?.caseNumber || 'CAS-XXXXXX'}
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(submissionResult?.caseNumber || '');
                        }}
                        className="p-2 hover:bg-light-beige rounded-lg transition-premium text-primary-gold"
                        title="Copy Case Number"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Submission Date</p>
                      <p className="text-sm font-bold text-dark-brown">
                        {submissionResult ? new Date(submissionResult.submissionDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Total Amount</p>
                      <p className="text-sm font-black text-primary-gold">
                        ${submissionResult?.totalAmount.toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  {submissionResult?.warnings && submissionResult.warnings.length > 0 && (
                    <div className="pt-2 text-xs text-amber-800 space-y-1">
                      <p className="font-bold uppercase tracking-widest text-stone-500">Notices</p>
                      {submissionResult.warnings.map((w, i) => (
                        <p key={i}>{w}</p>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-border pb-2">Next Steps</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-light-beige flex items-center justify-center text-xs font-bold text-primary-gold shrink-0">1</div>
                      <p className="text-xs text-stone-600">Our team will review your expenses and flight details within 7–14 business days.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-light-beige flex items-center justify-center text-xs font-bold text-primary-gold shrink-0">2</div>
                      <p className="text-xs text-stone-600">You will receive an email confirmation at {user?.email}.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-light-beige flex items-center justify-center text-xs font-bold text-primary-gold shrink-0">3</div>
                      <p className="text-xs text-stone-600">Track your claim status anytime in your dashboard.</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 border-b border-border pb-2">Expense Summary</h3>
                <div className="space-y-2">
                  {currentClaim.expenses?.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">{exp.merchant}</span>
                      <span className="font-bold text-dark-brown">${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/claims')} className="w-full md:w-auto px-12">View My Claims</Button>
                <Button variant="tertiary" onClick={() => {
                  setStep(0);
                  setReceiptFiles([]);
                  setPreviewWarnings([]);
                  setSubmissionResult(null);
                  setCurrentClaim({ totalAmount: 0, expenses: [] });
                }} className="w-full md:w-auto">
                  Submit Another Claim
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
