import React from 'react';
import { Booking, BookingStatus } from '../types';
import {
  X,
  ShieldCheck,
  Clock,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  ArrowRight
} from 'lucide-react';

interface Props {
  booking: Booking | null;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus, notes?: string) => void;
}

export const BookingDetailModal: React.FC<Props> = ({ booking, onClose, onUpdateStatus }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {booking.publicCode}
              </span>
              <h3 className="text-base font-bold text-slate-900">{booking.jobTitle}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dual-Trust State Machine & Authoritative Escrow Inspector
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Highlight Banner */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Lifecycle State</span>
            <span className="text-base font-bold text-white mt-0.5 block">{booking.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Escrow:</span>
            <span className="text-base font-bold text-emerald-400">₹{booking.priceBreakdown.total}</span>
          </div>
        </div>

        {/* Dual-Trust OTP Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Start OTP (Customer Secret)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                {booking.startOtpVerifiedAt ? 'VERIFIED' : 'ACTIVE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Numeric OTP:</span>
              <span className="font-mono text-xl font-bold tracking-widest text-blue-600">{booking.startOtp}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Required by worker to unlock work timer upon arrival.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completion OTP (Release)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                {booking.completionOtpVerifiedAt ? 'RELEASED' : 'LOCKED'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Numeric OTP:</span>
              <span className="font-mono text-xl font-bold tracking-widest text-emerald-700">{booking.completionOtp}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Shared by customer only after inspection of work.</p>
          </div>
        </div>

        {/* Customer & Worker Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" /> Customer Information
            </h4>
            <p className="text-slate-800 font-medium">{booking.customerName}</p>
            <p className="text-slate-500">{booking.customerPhone}</p>
            <p className="text-slate-500 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              {booking.customerAddress}
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Assigned Specialist
            </h4>
            <p className="text-slate-800 font-medium">
              {booking.workerName} <span className="text-blue-600 font-mono">({booking.workerKaamId})</span>
            </p>
            <p className="text-slate-500">Service Category: {booking.serviceCategory}</p>
            <p className="text-emerald-600 font-bold">Aadhaar & Skill Passport Verified</p>
          </div>
        </div>

        {/* Transparent Price Breakdown */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Authoritative Escrow Breakdown</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-400 block">Visit Charge:</span>
              <span className="font-bold text-slate-800">₹{booking.priceBreakdown.visitCharge}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Labor Estimate:</span>
              <span className="font-bold text-slate-800">₹{booking.priceBreakdown.taskEstimate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Platform Fee (2%):</span>
              <span className="font-bold text-slate-800">₹{booking.priceBreakdown.platformFee}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Locked:</span>
              <span className="font-bold text-blue-600 text-sm">₹{booking.priceBreakdown.total}</span>
            </div>
          </div>
        </div>

        {/* State Machine Transition Actions */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Transition State Machine (Admin / System override):</label>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              BookingStatus.BOOKING_CONFIRMED,
              BookingStatus.WORKER_ON_THE_WAY,
              BookingStatus.WORKER_ARRIVED,
              BookingStatus.IN_PROGRESS,
              BookingStatus.COMPLETION_REQUESTED,
              BookingStatus.COMPLETED,
              BookingStatus.SETTLED,
              BookingStatus.NO_SHOW_REVIEW,
              BookingStatus.REFUNDED,
            ].map((st) => (
              <button
                key={st}
                onClick={() => onUpdateStatus(booking.id, st, `Admin manual transition to ${st}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  booking.status === st
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
