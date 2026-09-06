import React, { useState } from 'react';
import { WorkerProfile, VerificationLevel } from '../types';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Clock,
  MapPin,
  FileCheck,
  TrendingUp,
  Settings,
  Plus
} from 'lucide-react';

interface WorkerPortalViewProps {
  worker: WorkerProfile;
  onUpdateWorker: (updated: Partial<WorkerProfile>) => void;
}

export const WorkerPortalView: React.FC<WorkerPortalViewProps> = ({
  worker,
  onUpdateWorker
}) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(worker.isAvailable);
  const [newSkillName, setNewSkillName] = useState('');
  const [pricingVisit, setPricingVisit] = useState(worker.pricing.visitCharge);
  const [pricingHourly, setPricingHourly] = useState(worker.pricing.hourlyRate);
  const [saveMessage, setSaveMessage] = useState('');

  const handleToggleAvailability = () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    onUpdateWorker({ isAvailable: nextVal });
  };

  const handleSavePricing = () => {
    onUpdateWorker({
      pricing: {
        ...worker.pricing,
        visitCharge: Number(pricingVisit),
        hourlyRate: Number(pricingHourly)
      }
    });
    setSaveMessage('Pricing rules updated and synced with Digital Kaam Escrow!');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const updatedSkills = [
      ...worker.skills,
      { name: newSkillName.trim(), level: 'Skilled' as const, verified: true }
    ];
    onUpdateWorker({ skills: updatedSkills });
    setNewSkillName('');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Kaam ID & Skill Passport */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={worker.avatar}
            alt={worker.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{worker.name}</h1>
              <span className="bg-blue-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow-sm">
                Kaam ID: {worker.kaamId}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{worker.trade} • {worker.experienceYears} Years Experience</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {worker.verificationLevel}
              </span>
              <span className="text-xs text-slate-400">Aadhaar KYC: Verified</span>
            </div>
          </div>
        </div>

        {/* Live Availability Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right text-xs">
            <span className="font-bold text-slate-800 block">Accepting Gigs</span>
            <span className="text-slate-400 text-[11px]">{isAvailable ? 'Active on map' : 'Offline'}</span>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
              isAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
          </button>
        </div>
      </div>

      {/* Grid: Skill Passport & Pricing Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Skill Passport & Certificates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Skill Passport Credentials</h2>
                <p className="text-xs text-slate-500 mt-0.5">Authoritative certifications endorsed through practical assessments</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                Tier 4 Certified
              </span>
            </div>

            {/* Verified Skills list */}
            <div className="space-y-3">
              {worker.skills.map((skill, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{skill.name}</h4>
                      <span className="text-xs text-slate-500 font-medium">Standard: {skill.level}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Inspected & Signed</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Skill form */}
            <form onSubmit={handleAddSkill} className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add special skill (e.g. Copper Gas Welding)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </form>
          </div>

          {/* Performance & On-Time Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Partner Quality Scorecard</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Jobs Done</p>
                <p className="text-2xl font-bold text-slate-900">{worker.jobsCompleted}</p>
                <span className="text-[11px] text-emerald-600 font-medium">100% Verified Escrow</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">On-Time Arrival</p>
                <p className="text-2xl font-bold text-slate-900">{worker.onTimeRate}%</p>
                <span className="text-[11px] text-emerald-600 font-medium">Under 15m Grace</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Rating</p>
                <p className="text-2xl font-bold text-slate-900">{worker.rating} / 5</p>
                <span className="text-[11px] text-slate-500 font-medium">{worker.reviewCount} customer reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Transparent Pricing Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">Transparent Pricing Controls</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              In Digital Kaam, all rates are locked before booking to prevent surprise on-site disputes.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Visit & Inspection Charge (₹)</label>
                <input
                  type="number"
                  value={pricingVisit}
                  onChange={(e) => setPricingVisit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-800 outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Covers travel & initial diagnostic check</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Standard Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={pricingHourly}
                  onChange={(e) => setPricingHourly(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-800 outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Applied for active work hours authorized by Start OTP</span>
              </div>

              <button
                onClick={handleSavePricing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-xs shadow-sm"
              >
                Save Rate Card
              </button>

              {saveMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Direct Bank Settlement info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Automated Settlement VPA</h3>
            <p className="text-slate-500 leading-relaxed">
              Completion OTP triggers instant zero-delay UPI disbursement directly into your linked account:
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold flex items-center justify-between">
              <span>rohan.electrician@okhdfcbank</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
