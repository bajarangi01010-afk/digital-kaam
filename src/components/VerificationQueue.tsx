import React, { useState } from 'react';
import { WorkerProfile, VerificationLevel } from '../types';
import { ShieldCheck, Award, FileCheck, Check, X, Eye, ExternalLink, BadgeCheck } from 'lucide-react';

interface Props {
  workers: WorkerProfile[];
  onUpdateWorkerVerification: (workerId: string, level: VerificationLevel, govtStatus: 'APPROVED' | 'IN_REVIEW' | 'REJECTED') => void;
}

export const VerificationQueue: React.FC<Props> = ({ workers, onUpdateWorkerVerification }) => {
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(workers[0] || null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleApprove = (worker: WorkerProfile) => {
    onUpdateWorkerVerification(worker.id, VerificationLevel.LEVEL_4_MASTER_PARTNER, 'APPROVED');
    setStatusMessage(`Approved ${worker.name} as Level 4 Master Verified Partner!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleReject = (worker: WorkerProfile) => {
    onUpdateWorkerVerification(worker.id, VerificationLevel.LEVEL_1_MOBILE, 'REJECTED');
    setStatusMessage(`Flagged ${worker.name} for document re-upload.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Info Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Worker Trust & Skill Passport Verification</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Level 0 → Level 4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing strict government Aadhaar authentication, trade ITI certification, and police verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Zero Fake Profiles Mandate
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-blue-600" />
          {statusMessage}
        </div>
      )}

      {/* Grid: List of Applicants + Verification Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Technicians</h3>
          <div className="space-y-2">
            {workers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">अभी कोई कारीगर रजिस्टर नहीं है</p>
            ) : (
              workers.map((worker) => {
                const isSelected = selectedWorker?.id === worker.id;
                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        loading="lazy"
                        decoding="async"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{worker.name}</h4>
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {worker.kaamId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{worker.trade}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-emerald-600 font-semibold">{worker.verificationLevel}</span>
                          <span className="text-[10px] text-slate-400">{worker.jobsCompleted} jobs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        {selectedWorker ? (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedWorker.avatar}
                alt={selectedWorker.name}
                loading="lazy"
                decoding="async"
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedWorker.name}</h3>
                  <span className="bg-blue-50 text-blue-700 font-mono text-xs px-2 py-0.5 rounded font-bold border border-blue-200">
                    {selectedWorker.kaamId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedWorker.trade} • {selectedWorker.experienceYears} yrs experience</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReject(selectedWorker)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-lg border border-slate-200 transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                Reject / Flag
              </button>
              <button
                id="approve-worker-verification-btn"
                onClick={() => handleApprove(selectedWorker)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Skill Passport
              </button>
            </div>
          </div>

          {/* Verification Checkpoints (Levels 1 to 4) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Multi-Tier Verification Checklist</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Level 1: Phone OTP</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                </div>
                <p className="text-slate-500 text-[11px]">Primary mobile number authenticated with SMS gateway.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Level 2: Govt Aadhaar KYC</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedWorker.govtIdStatus}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Masked offline Aadhaar XML validated with UIDAI signature.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Level 3: Skill Passport</span>
                  <span className="text-blue-700 font-bold text-[10px] bg-blue-100 px-2 py-0.5 rounded">VERIFIED</span>
                </div>
                <p className="text-slate-500 text-[11px]">ITI Trade Diploma & hands-on practical assessment passed.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Level 4: Master Standing</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedWorker.onTimeRate}% ON-TIME
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Over 100 successful completed jobs with zero unexcused no-shows.</p>
              </div>
            </div>
          </div>

          {/* Skill Passport Ledger */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Declared & Tested Skills</h4>
            <div className="space-y-2">
              {selectedWorker.skills.map((skill, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{skill.name}</span>
                    <span className="text-slate-500 ml-2">({skill.level})</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Document Checked ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-300" />
          <p className="font-bold text-slate-600">कोई कारीगर चयनित नहीं है</p>
          <p>लिस्ट में से किसी कारीगर को चुनें या नए रजिस्ट्रेशन का इंतज़ार करें।</p>
        </div>
      )}
    </div>
  </div>
  );
};
