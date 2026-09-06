import React, { useState } from 'react';
import { AuditLogItem, DisputeItem } from '../types';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

interface DisputesAuditViewProps {
  auditLogs: AuditLogItem[];
  disputes: DisputeItem[];
  onResolveDispute: (disputeId: string, resolution: string) => void;
}

export const DisputesAuditView: React.FC<DisputesAuditViewProps> = ({
  auditLogs,
  disputes,
  onResolveDispute
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'disputes'>('audit');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trust Ledger & Dispute Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof event journal recording every state transition, OTP verification hash, and dispute resolution.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Journal ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('disputes')}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'disputes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disputes Desk ({disputes.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'audit' ? (
        /* Immutable Audit Log Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Cryptographic Transaction Event Log</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">SHA-256 Verified • Append-Only</span>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                  <th className="px-6 py-4 font-bold">Timestamp & Hash</th>
                  <th className="px-6 py-4 font-bold">Actor & Role</th>
                  <th className="px-6 py-4 font-bold">Action Event</th>
                  <th className="px-6 py-4 font-bold">Booking Ref</th>
                  <th className="px-6 py-4 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-900 block font-semibold">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.hash}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-sans">
                      <span className="font-semibold text-slate-800">{log.actor}</span>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{log.actorRole}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'ALERT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">
                      {log.bookingCode || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-sans text-xs max-w-sm">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Disputes Desk */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Registered Platform Claims</h2>
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedDispute?.id === d.id
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-800">{d.bookingCode}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                      {d.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{d.category}: {d.complainantName}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{d.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Filed: {d.filedAt}</span>
                    <span className="font-bold text-slate-800">Claim: ₹{d.claimAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Resolution Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Authoritative Settlement Rules</h3>
            <p className="text-slate-500 leading-relaxed">
              Every dispute resolution adheres to the Dual-Trust SLA:
            </p>
            <ul className="space-y-2 text-slate-600 list-disc pl-4">
              <li><strong>No-Show Rule:</strong> Verified absence past 15 min triggers 100% immediate automated refund.</li>
              <li><strong>Completion OTP Rule:</strong> Once shared by the customer, payment is considered acknowledged and released.</li>
              <li><strong>Dispute Hold:</strong> Platform can withhold escrow settlement up to 48 hours during formal review.</li>
            </ul>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
              <span className="font-bold block mb-1">Audit Compliance</span>
              <span>All resolutions are cryptographically hashed and logged to prevent internal collusion.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
