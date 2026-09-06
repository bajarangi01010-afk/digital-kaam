import React from 'react';
import { Booking, AuditLogItem } from '../types';
import { CreditCard, ShieldCheck, ArrowDownLeft, ArrowUpRight, Lock, History, Hash } from 'lucide-react';

interface Props {
  bookings: Booking[];
  auditLogs: AuditLogItem[];
}

export const PaymentsEscrowView: React.FC<Props> = ({ bookings, auditLogs }) => {
  const totalInEscrow = bookings
    .filter((b) => b.status !== 'SETTLED' && b.status !== 'REFUNDED')
    .reduce((acc, b) => acc + b.priceBreakdown.total, 0);

  const totalSettled = bookings
    .filter((b) => b.status === 'SETTLED')
    .reduce((acc, b) => acc + b.priceBreakdown.total, 0);

  const totalPlatformFees = bookings.reduce((acc, b) => acc + b.priceBreakdown.platformFee, 0);

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vault Escrow Locked</span>
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{totalInEscrow.toLocaleString('en-IN')}.00</h3>
          <p className="text-xs text-slate-500 mt-1">Held until Completion OTP verification</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payouts Settled</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{totalSettled.toLocaleString('en-IN')}.00</h3>
          <p className="text-xs text-emerald-600 mt-1 font-medium">100% On-time bank transfers</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Revenue (2%)</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{totalPlatformFees.toLocaleString('en-IN')}.00</h3>
          <p className="text-xs text-slate-500 mt-1">Razorpay webhook reconciled</p>
        </div>
      </div>

      {/* Escrow Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Escrow Transaction Ledger</h3>
            <p className="text-xs text-slate-500">Every rupee tracked from customer pre-authorization to final technician settlement</p>
          </div>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-bold border border-blue-200">
            Razorpay Webhook v2 Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5 font-bold">Booking / Txn ID</th>
                <th className="px-6 py-3.5 font-bold">Customer</th>
                <th className="px-6 py-3.5 font-bold">Specialist</th>
                <th className="px-6 py-3.5 font-bold">Total Amount</th>
                <th className="px-6 py-3.5 font-bold">Escrow State</th>
                <th className="px-6 py-3.5 font-bold text-right">Payment Confirmed</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                    <div>{b.publicCode}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{b.paymentId}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-800">{b.customerName}</td>
                  <td className="px-6 py-4 text-slate-800 font-medium">
                    {b.workerName} <span className="text-blue-600">({b.workerKaamId})</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{b.priceBreakdown.total}</td>
                  <td className="px-6 py-4">
                    {b.status === 'SETTLED' ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        DISBURSED TO WORKER
                      </span>
                    ) : b.status === 'REFUNDED' ? (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        REFUNDED 100%
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        LOCKED IN ESCROW
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                    {b.paymentConfirmedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Cryptographic Audit Logs */}
      <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Immutable Security & Audit Ledger</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            SHA-256 Chain Signed
          </span>
        </div>

        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start justify-between text-xs font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">{log.timestamp}</span>
                  <span className="text-slate-400 font-semibold">• {log.actor}</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-sans">
                    {log.actorRole}
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-xs">{log.details}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-emerald-400 text-[10px] font-bold block">{log.action}</span>
                <span className="text-slate-500 text-[9px] block mt-0.5">{log.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
