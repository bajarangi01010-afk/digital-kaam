import React, { useState } from 'react';
import { WorkerProfile, Booking, BookingStatus } from '../types';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import {
  X,
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lang: Language;
  onConfirmBooking: (booking: Partial<Booking>) => void;
}

export const EscrowBookingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  worker,
  customerName,
  customerPhone,
  customerAddress,
  lang,
  onConfirmBooking,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState('आज (Today), 45 मिनट के भीतर');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !worker) return null;

  const effectiveJobTitle = jobTitle || `${worker.trade} सेवा व रिपेयर`;

  const visitCharge = worker.pricing.visitCharge || 199;
  const taskEstimate = 450;
  const platformFee = Math.round((visitCharge + taskEstimate) * 0.02);
  const gstTax = Math.round((visitCharge + taskEstimate) * 0.05);
  const totalAmount = visitCharge + taskEstimate + platformFee + gstTax;

  const handlePayAndBook = () => {
    sound.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      sound.playCash();
      setIsProcessing(false);

      const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const publicCode = `DK-BKG-${Math.floor(1000 + Math.random() * 9000)}`;

      onConfirmBooking({
        publicCode,
        customerName,
        customerPhone,
        customerAddress,
        workerId: worker.id,
        workerName: worker.name,
        workerKaamId: worker.kaamId,
        serviceCategory: worker.trade,
        jobTitle: effectiveJobTitle,
        description: `Direct Escrow booking for ${worker.trade}.`,
        scheduledTime,
        status: BookingStatus.BOOKING_CONFIRMED,
        priceBreakdown: {
          visitCharge,
          taskEstimate,
          platformFee,
          gstTax,
          total: totalAmount,
        },
        paymentMethod: 'UPI / Escrow',
        paymentId: `pay_rzp_${Date.now().toString().slice(-8)}`,
        paymentConfirmedAt: 'अभी-अभी (Just now)',
        startOtp,
        completionOtp,
        notes: '100% No-show refund guarantee applied.',
      });

      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Digital Kaam Escrow
              </span>
              <h3 className="text-base font-bold text-slate-900">सुरक्षित एस्क्रो बुकिंग</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              100% नो-शो ऑटो रिफंड सुरक्षा के साथ कारीगर बुक करें
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Summary */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{worker.name}</h4>
              <p className="text-xs text-slate-500">{worker.trade} • {worker.kaamId}</p>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                आधार व फेस 100% सत्यापित
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-blue-600">{worker.distanceKm} किमी दूर</span>
          </div>
        </div>

        {/* Job Title & Scheduled Time */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">काम का विवरण (Work Purpose):</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">आगमन का समय (Estimated Arrival):</label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-hidden"
            />
          </div>
        </div>

        {/* Escrow Price Breakdown */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            पारदर्शी एस्क्रो ब्रेकडाउन (Escrow Breakdown)
          </h4>

          <div className="space-y-1 text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>विज़िट / डायग्नोस्टिक शुल्क:</span>
              <span className="font-bold text-slate-800">₹{visitCharge}</span>
            </div>
            <div className="flex justify-between">
              <span>अनुमानित मजदूरी (Labor Estimate):</span>
              <span className="font-bold text-slate-800">₹{taskEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span>डिजिटल काम सेवा शुल्क (2%):</span>
              <span className="font-bold text-slate-800">₹{platformFee}</span>
            </div>
            <div className="flex justify-between">
              <span>लागू जीएसटी (GST 5%):</span>
              <span className="font-bold text-slate-800">₹{gstTax}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
              <span>कुल एस्क्रो में लॉक की जाने वाली राशि:</span>
              <span className="text-indigo-600">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* 100% No-Show Refund Assurance & Direct Call Unlock Notice */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="block text-emerald-950">100% सुरक्षित एस्क्रो व नो-शो ऑटो-रिफंड गारंटी:</strong>
              यह विज़िट राशि डिजिटल काम के सुरक्षित एस्क्रो वॉल्ट में रहेगी। कारीगर को भुगतान कार्य समाप्ति और आपके OTP के बाद ही मिलेगा। यदि कारीगर नहीं आता, तो तुरंत पूरा रिफंड!
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>भुगतान होते ही कारीगर को तत्काल नोटिफिकेशन जाएगा और <strong>डायरेक्ट कॉल अनलॉक</strong> हो जाएगी।</span>
          </div>
        </div>

        {/* Pay Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            रद्द करें
          </button>

          <button
            id="confirm-escrow-pay-btn"
            disabled={isProcessing}
            onClick={handlePayAndBook}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                एस्क्रो में लॉक हो रहा है...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                ₹{totalAmount} पे करें और बुक करें
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
