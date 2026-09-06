import React, { useState } from 'react';
import { WorkerProfile, Booking } from '../types';
import { ShieldCheck, Star, Clock, MapPin, Award, CheckCircle2, ArrowRight, Zap, Filter } from 'lucide-react';

interface Props {
  workers: WorkerProfile[];
  onSelectWorkerForBooking: (worker: WorkerProfile) => void;
}

export const MarketplaceView: React.FC<Props> = ({ workers, onSelectWorkerForBooking }) => {
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  const trades = ['All', 'Electrician', 'Plumbing', 'Carpentry', 'Air Cooling', 'HVAC'];

  const filtered = workers.filter((w) => {
    const matchesTrade = selectedTrade === 'All' || w.trade.toLowerCase().includes(selectedTrade.toLowerCase());
    const matchesSearch =
      w.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.kaamId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.trade.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.serviceArea.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesTrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Verified Marketplace — Digital Kaam</h2>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified tradesmen with authenticated Aadhaar, ITI certifications, and fixed visit fees.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {trades.map((trade) => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTrade === trade
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition space-y-5"
          >
            <div>
              {/* Profile Top Row */}
              <div className="flex items-start gap-4">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 truncate">{worker.name}</h3>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {worker.kaamId}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{worker.trade}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="flex items-center font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                      {worker.rating}
                    </span>
                    <span className="text-slate-400">({worker.reviewCount} reviews)</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                      {worker.verificationLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio & Service Area */}
              <p className="text-xs text-slate-600 mt-4 line-clamp-2 leading-relaxed">{worker.bio}</p>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{worker.serviceArea}</span>
                <span className="text-blue-600 font-bold ml-1">• {worker.distanceKm} km away</span>
              </div>

              {/* Skill Passport Badges */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Verified Skill Passport:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing & CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Standard Charges</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900">₹{worker.pricing.visitCharge}</span>
                  <span className="text-xs text-slate-500">visit + ₹{worker.pricing.hourlyRate}/hr</span>
                </div>
              </div>

              <button
                id={`marketplace-book-${worker.id}-btn`}
                onClick={() => onSelectWorkerForBooking(worker)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                Book with Escrow
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
