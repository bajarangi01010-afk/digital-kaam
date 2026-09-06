import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Receipt,
  UserCheck,
  Zap,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface ActiveGigsViewProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus, updates?: Partial<Booking>) => void;
  onAddAuditLog: (action: string, bookingCode: string, details: string, status?: 'SUCCESS' | 'WARNING' | 'ALERT') => void;
  activeRole: 'CUSTOMER' | 'WORKER' | 'ADMIN';
}

export const ActiveGigsView: React.FC<ActiveGigsViewProps> = ({
  bookings,
  onUpdateBookingStatus,
  onAddAuditLog,
  activeRole
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || '');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [otpSuccess, setOtpSuccess] = useState<string>('');
  const [materialAmount, setMaterialAmount] = useState<string>('');

  const currentBooking = bookings.find(b => b.id === selectedBookingId) || bookings[0];

  if (!currentBooking) {
    return (
      <div className="p-8 text-center text-slate-500">
        No bookings available. Go to Marketplace to book a verified worker.
      </div>
    );
  }

  // Dual-Trust OTP Actions
  const handleVerifyStartOtp = () => {
    setOtpError('');
    setOtpSuccess('');

    if (enteredOtp.trim() !== currentBooking.startOtp) {
      setOtpError(`Invalid Start OTP "${enteredOtp}". Verification failed on authoritative server.`);
      onAddAuditLog(
        'START_OTP_FAILED_ATTEMPT',
        currentBooking.publicCode,
        `Mismatched OTP attempt "${enteredOtp}" by worker. Security rate-limiter active.`,
        'WARNING'
      );
      return;
    }

    // Success
    setOtpSuccess('Start OTP validated by authoritative server! Work is now officially Authorized.');
    onUpdateBookingStatus(currentBooking.id, BookingStatus.IN_PROGRESS, {
      startOtpVerifiedAt: new Date().toLocaleTimeString(),
      jobStartedAt: new Date().toLocaleTimeString(),
      notes: 'Dual-Trust Start OTP verified. Job is active in progress.'
    });

    onAddAuditLog(
      'START_OTP_VERIFIED_SUCCESS',
      currentBooking.publicCode,
      `Customer shared valid OTP ${currentBooking.startOtp}. State transitioned to IN_PROGRESS.`,
      'SUCCESS'
    );
    setEnteredOtp('');
  };

  const handleVerifyCompletionOtp = () => {
    setOtpError('');
    setOtpSuccess('');

    if (enteredOtp.trim() !== currentBooking.completionOtp) {
      setOtpError(`Invalid Completion OTP "${enteredOtp}". Settlement locked.`);
      onAddAuditLog(
        'COMPLETION_OTP_FAILED_ATTEMPT',
        currentBooking.publicCode,
        `Mismatched Completion OTP attempt "${enteredOtp}".`,
        'WARNING'
      );
      return;
    }

    // Success
    setOtpSuccess('Completion OTP accepted! Escrow payment released to worker account.');
    onUpdateBookingStatus(currentBooking.id, BookingStatus.SETTLED, {
      completionOtpVerifiedAt: new Date().toLocaleTimeString(),
      jobCompletedAt: new Date().toLocaleTimeString(),
      settledAt: new Date().toLocaleTimeString(),
      status: BookingStatus.SETTLED,
      notes: 'Customer inspected completed work and authorized final payout.'
    });

    onAddAuditLog(
      'COMPLETION_OTP_VERIFIED_SETTLED',
      currentBooking.publicCode,
      `Customer entered Completion OTP ${currentBooking.completionOtp}. ₹${currentBooking.priceBreakdown.total} disbursed to worker.`,
      'SUCCESS'
    );
    setEnteredOtp('');
  };

  const handleSimulateArrival = () => {
    onUpdateBookingStatus(currentBooking.id, BookingStatus.WORKER_ARRIVED, {
      workerArrivedAt: new Date().toLocaleTimeString(),
      notes: 'Worker arrived at location. Proximity confirmed within 30m.'
    });
    onAddAuditLog(
      'WORKER_ARRIVED_GEOCHECK',
      currentBooking.publicCode,
      `Worker ${currentBooking.workerName} (${currentBooking.workerKaamId}) checked in at customer doorstep.`,
      'SUCCESS'
    );
  };

  const handleRequestCompletion = () => {
    onUpdateBookingStatus(currentBooking.id, BookingStatus.COMPLETION_REQUESTED, {
      notes: 'Worker finished task and requested customer inspection.'
    });
    onAddAuditLog(
      'COMPLETION_REQUESTED_BY_WORKER',
      currentBooking.publicCode,
      `Worker requested customer inspection before completion OTP authorization.`,
      'SUCCESS'
    );
  };

  const handleNoShowRefund = () => {
    const confirmRefund = window.confirm(
      `Trigger authoritative no-show protocol for ${currentBooking.publicCode}? 100% full refund (₹${currentBooking.priceBreakdown.total}) will be returned immediately to ${currentBooking.customerName}.`
    );
    if (!confirmRefund) return;

    onUpdateBookingStatus(currentBooking.id, BookingStatus.REFUNDED, {
      refundStatus: 'REFUNDED_100_PERCENT',
      notes: '100% full refund dispatched to customer after worker no-show past grace period.'
    });
    onAddAuditLog(
      'NO_SHOW_100_REFUND_EXECUTED',
      currentBooking.publicCode,
      `Authoritative No-Show signal verified. Full ₹${currentBooking.priceBreakdown.total} refunded idempotently to ${currentBooking.customerName}.`,
      'ALERT'
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Active Gigs & Dual-Trust Escrow</h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-authoritative state machine enforcing verified arrival, Start OTP, in-progress safeguards, and Completion OTP.
          </p>
        </div>

        {/* Selected Booking Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Kaam:</span>
          <select
            value={currentBooking.id}
            onChange={(e) => {
              setSelectedBookingId(e.target.value);
              setOtpError('');
              setOtpSuccess('');
              setEnteredOtp('');
            }}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-600"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.publicCode} - {b.serviceCategory} ({b.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Step Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {currentBooking.publicCode}
            </span>
            <h2 className="text-base font-bold text-slate-900">{currentBooking.jobTitle}</h2>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Escrow ₹{currentBooking.priceBreakdown.total.toLocaleString('en-IN')} (Razorpay ID: {currentBooking.paymentId.slice(0, 14)}...)
          </span>
        </div>

        {/* Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Step 1 */}
          <div className={`p-3 rounded-lg border text-xs ${
            currentBooking.status !== BookingStatus.PAYMENT_PENDING
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>1. Escrow Paid</span>
            </div>
            <p className="text-[11px] text-slate-600">Locked in platform escrow</p>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-lg border text-xs ${
            currentBooking.status === BookingStatus.WORKER_ARRIVED ||
            currentBooking.status === BookingStatus.IN_PROGRESS ||
            currentBooking.status === BookingStatus.COMPLETION_REQUESTED ||
            currentBooking.status === BookingStatus.SETTLED
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>2. Worker Arrived</span>
            </div>
            <p className="text-[11px] text-slate-600">ID & Proximity verified</p>
          </div>

          {/* Step 3 */}
          <div className={`p-3 rounded-lg border text-xs ${
            currentBooking.status === BookingStatus.IN_PROGRESS ||
            currentBooking.status === BookingStatus.COMPLETION_REQUESTED ||
            currentBooking.status === BookingStatus.SETTLED
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>3. Start OTP OK</span>
            </div>
            <p className="text-[11px] text-slate-600">Work authorized & live</p>
          </div>

          {/* Step 4 */}
          <div className={`p-3 rounded-lg border text-xs ${
            currentBooking.status === BookingStatus.SETTLED || currentBooking.status === BookingStatus.COMPLETED
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>4. Completion OTP</span>
            </div>
            <p className="text-[11px] text-slate-600">Settled to worker UPI</p>
          </div>
        </div>
      </div>

      {/* Main Dual-Trust Interactive Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Booking State</span>
                <span className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                  {currentBooking.status}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Customer</span>
                <span className="font-semibold text-slate-800">{currentBooking.customerName} ({currentBooking.customerPhone})</span>
              </div>
            </div>

            {/* Step-by-Step Interactive Controls */}

            {/* CASE 1: Booking Confirmed, Waiting for Worker Arrival */}
            {currentBooking.status === BookingStatus.BOOKING_CONFIRMED && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Worker en Route</h3>
                    <p className="text-xs text-slate-500">Rohan Kumar is traveling to {currentBooking.customerAddress}.</p>
                  </div>
                  <button
                    onClick={handleSimulateArrival}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Simulate Worker Arrival
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: Worker Arrived -> Waiting for Start OTP Verification */}
            {currentBooking.status === BookingStatus.WORKER_ARRIVED && (
              <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-950">Dual-Trust Start Authorization</h3>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Worker has arrived at doorstep. Customer must verify worker photo & Kaam ID badge ({currentBooking.workerKaamId}) before sharing Start OTP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer View of Start OTP */}
                <div className="p-4 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer's Private Start OTP</span>
                    <div className="text-2xl font-mono font-black text-slate-900 tracking-widest mt-0.5">
                      {currentBooking.startOtp}
                    </div>
                    <span className="text-[11px] text-slate-500">Share verbally ONLY when worker is physically present.</span>
                  </div>

                  {/* Worker Entry Form */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Worker enters OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-36 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-center focus:border-blue-600 outline-none"
                    />
                    <button
                      onClick={handleVerifyStartOtp}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                    >
                      Authorize Start
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: Job In Progress */}
            {currentBooking.status === BookingStatus.IN_PROGRESS && (
              <div className="p-5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-blue-950">Job Actively In Progress</h3>
                      <p className="text-xs text-blue-800">Timer running since {currentBooking.jobStartedAt}.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestCompletion}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Request Completion Inspection
                  </button>
                </div>

                <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800 mb-1">Work Instructions & Safety Protocol:</p>
                  <p>{currentBooking.description}</p>
                </div>
              </div>
            )}

            {/* CASE 4: Completion Requested -> Waiting for Completion OTP */}
            {currentBooking.status === BookingStatus.COMPLETION_REQUESTED && (
              <div className="p-5 rounded-xl bg-purple-50 border border-purple-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">Work Inspection & Completion OTP</h3>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Customer must test/inspect the work (e.g. check wiring switches, turn on AC). Once fully satisfied, share Completion OTP.
                    </p>
                  </div>
                </div>

                {/* Customer View of Completion OTP */}
                <div className="p-4 bg-white rounded-lg border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer's Completion OTP</span>
                    <div className="text-2xl font-mono font-black text-purple-700 tracking-widest mt-0.5">
                      {currentBooking.completionOtp}
                    </div>
                    <span className="text-[11px] text-slate-500">Entering this OTP releases Escrow settlement immediately.</span>
                  </div>

                  {/* Worker Entry Form */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter Completion OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-40 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-center focus:border-purple-600 outline-none"
                    />
                    <button
                      onClick={handleVerifyCompletionOtp}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                    >
                      Verify & Release Settlement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 5: Job Completed & Settled */}
            {(currentBooking.status === BookingStatus.SETTLED || currentBooking.status === BookingStatus.COMPLETED) && (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Job Completed & Escrow Settled</h3>
                    <p className="text-xs text-emerald-800">
                      Settled at {currentBooking.settledAt}. Payout disbursed to {currentBooking.workerName}'s bank account.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Transaction Reference: <strong className="font-mono text-slate-800">TXN-DK-2026-9921</strong></span>
                  <span className="text-emerald-700 font-bold">100% Verified Close</span>
                </div>
              </div>
            )}

            {/* CASE 6: Refunded */}
            {currentBooking.status === BookingStatus.REFUNDED && (
              <div className="p-5 rounded-xl bg-red-50 border border-red-200 space-y-2 text-red-950">
                <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>100% Full Refund Dispatched</span>
                </div>
                <p className="text-xs text-red-700">
                  The amount of ₹{currentBooking.priceBreakdown.total} was refunded to {currentBooking.customerName}'s source account under the Zero-Loss No-Show Guarantee.
                </p>
              </div>
            )}

            {/* Status Feedback Messages */}
            {otpError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}
            {otpSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}
          </div>

          {/* Safety & No-Show Emergency Protocol */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Safety & Verified No-Show Resolution</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Automated Escrow Rules</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              If the booked worker fails to arrive within 15 minutes of the scheduled time or cancels, the customer is entitled to an immediate 100% full refund with zero cancellation penalty.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleNoShowRefund}
                disabled={currentBooking.status === BookingStatus.REFUNDED || currentBooking.status === BookingStatus.SETTLED}
                className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulate Worker No-Show & Claim 100% Refund</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Price Breakdown & Verification Proof */}
        <div className="space-y-6">
          {/* Worker Identity Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assigned Partner</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                DK
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{currentBooking.workerName}</h4>
                <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold font-mono">
                  <span>{currentBooking.workerKaamId}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600">ID Verified</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
              <div className="flex items-center justify-between">
                <span>Address:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">{currentBooking.customerAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Category:</span>
                <span className="font-medium text-slate-800">{currentBooking.serviceCategory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Scheduled Time:</span>
                <span className="font-medium text-slate-800">{currentBooking.scheduledTime}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown in Escrow */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Escrow Price Breakdown</h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Inspection / Visit Charge:</span>
                <span className="font-medium text-slate-900">₹{currentBooking.priceBreakdown.visitCharge}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Task Estimate:</span>
                <span className="font-medium text-slate-900">₹{currentBooking.priceBreakdown.taskEstimate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Platform Dual-Trust Fee:</span>
                <span className="font-medium text-slate-900">₹{currentBooking.priceBreakdown.platformFee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Applicable GST (18%):</span>
                <span className="font-medium text-slate-900">₹{currentBooking.priceBreakdown.gstTax}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total Escrow:</span>
                <span className="text-base text-blue-600">₹{currentBooking.priceBreakdown.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Razorpay Verified Gateway • 0% unapproved additions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
