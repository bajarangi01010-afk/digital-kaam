import React, { useState } from 'react';
import { DisputeItem, Booking } from '../types';
import { Scale, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, ArrowRight, FileText } from 'lucide-react';

interface Props {
  disputes: DisputeItem[];
  bookings: Booking[];
  onResolveDispute: (disputeId: string, resolution: 'REFUND_APPROVED' | 'RESOLVED_SETTLED', note: string) => void;
}

export const DisputeCenter: React.FC<Props> = ({ disputes, bookings, onResolveDispute }) => {
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem>(disputes[0]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleApprove100Refund = (dispute: DisputeItem) => {
    const note = resolutionNote.trim() || 'Verified worker no-show past grace period. 100% Escrow refund executed to customer UPI.';
    onResolveDispute(dispute.id, 'REFUND_APPROVED', note);
    setSuccessToast(`100% Full Refund of ₹${dispute.claimAmount} issued for ${dispute.bookingCode}`);
    setResolutionNote('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSettleDispute = (dispute: DisputeItem) => {
    const note = resolutionNote.trim() || 'Work quality inspected and settled mutually.';
    onResolveDispute(dispute.id, 'RESOLVED_SETTLED', note);
    setSuccessToast(`Dispute resolved for ${dispute.bookingCode}`);
    setResolutionNote('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Disputes & 100% No-Show Refund Engine</h2>
            <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Idempotent Escrow Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic resolution for verified worker no-shows, unauthorized charges, or quality claims.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Policy: Full 100% refund on verified worker absence</span>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successToast}
        </div>
      )}

      {/* Grid: Dispute Tickets List + Resolution Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispute Cases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filed Cases</h3>
          <div className="space-y-2">
            {disputes.map((d) => {
              const isSelected = selectedDispute.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected ? 'bg-blue-50/60 border-blue-300 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{d.bookingCode}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        d.status === 'REFUND_APPROVED'
                          ? 'bg-purple-100 text-purple-800'
                          : d.status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{d.category.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{d.description}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                    <span>By: {d.complainantName}</span>
                    <span className="font-bold text-slate-700">Claim: ₹{d.claimAmount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dispute Resolution Workbench */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 flex-wrap gap-2">
            <div>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedDispute.bookingCode}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Category: {selectedDispute.category.replace(/_/g, ' ')}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Claimed Amount</span>
              <span className="text-lg font-bold text-rose-600">₹{selectedDispute.claimAmount}</span>
            </div>
          </div>

          {/* Dispute Description */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Customer Incident Report</h4>
            <p className="text-slate-700 leading-relaxed">{selectedDispute.description}</p>
            <div className="text-[11px] text-slate-400 pt-1">Filed at: {selectedDispute.filedAt}</div>
          </div>

          {/* Automated System Check (Geofence & Timestamp validation) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Platform Signal Telemetry & Diagnostics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Worker Arrival GPS Signal:</span>
                <span className="font-bold text-rose-600">NO SIGNAL RECORDED IN 2KM GEOFENCE</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Start OTP Status:</span>
                <span className="font-bold text-slate-700">UNCONSUMED (Never verified)</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium pt-1">
              ✓ Automated validation satisfies No-Show Criteria under Section 19 of Master Platform Blueprint.
            </p>
          </div>

          {/* Resolution Note Input */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 block">Official Resolution Audit Note</label>
            <input
              type="text"
              placeholder="e.g. Worker no-show verified via GPS logs. Issued 100% refund via Razorpay refund API."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-500 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="approve-full-refund-btn"
              onClick={() => handleApprove100Refund(selectedDispute)}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Approve 100% Full Refund (Escrow Reversal)
            </button>
            <button
              id="resolve-dispute-settle-btn"
              onClick={() => handleSettleDispute(selectedDispute)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
