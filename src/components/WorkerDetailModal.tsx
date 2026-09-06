import React from 'react';
import { WorkerProfile } from '../types';
import { Language, translations } from '../utils/i18n';
import { sound } from '../utils/audio';
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
  Award,
  Zap,
  UserCheck,
  Languages
} from 'lucide-react';

interface Props {
  worker: WorkerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onBookWorker: (worker: WorkerProfile) => void;
  onDirectCall: (worker: WorkerProfile) => void;
}

export const WorkerDetailModal: React.FC<Props> = ({
  worker,
  isOpen,
  onClose,
  lang,
  onBookWorker,
  onDirectCall,
}) => {
  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-start justify-between relative border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={worker.avatar}
                alt={worker.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white ${
                  worker.isAvailable ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
                title={worker.isAvailable ? 'उपलब्ध (Available)' : 'व्यस्त (Busy)'}
              >
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">{worker.name}</h3>
                <span className="font-mono text-xs font-bold text-blue-300 bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700">
                  {worker.kaamId}
                </span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  आधार व फेस 100% सत्यापित
                </span>
              </div>

              <p className="text-xs sm:text-sm text-indigo-200 mt-1 font-semibold">{worker.trade}</p>

              <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                <span className="flex items-center font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                  {worker.rating}
                  <span className="text-slate-300 font-normal ml-1">({worker.reviewCount} समीक्षाएं)</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-400 font-bold">{worker.jobsCompleted} काम पूरे किए</span>
                <span className="text-slate-300">•</span>
                <span className="text-cyan-300 font-bold">{worker.onTimeRate}% समयबद्धता</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">अनुभव</span>
              <span className="text-sm font-black text-slate-800 mt-0.5 block">{worker.experienceYears} वर्ष</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">विज़िट शुल्क</span>
              <span className="text-sm font-black text-emerald-600 mt-0.5 block">₹{worker.pricing.visitCharge}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">प्रति घंटा दर</span>
              <span className="text-sm font-black text-indigo-600 mt-0.5 block">₹{worker.pricing.hourlyRate}/घंटा</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">दूरी (Distance)</span>
              <span className="text-sm font-black text-blue-600 mt-0.5 block">{worker.distanceKm} किमी दूर</span>
            </div>
          </div>

          {/* Verification & Trust Passport */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                डिजिटल काम सत्यापन पासपोर्ट (Level 4 Master Verified)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>UIDAI आधार कार्ड व नाम 100% OCR सत्यापित</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3D बायोमेट्रिक लाइव फेस एंटी-स्पूफिंग सत्यापित</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>स्थानीय पुलिस बैकग्राउंड क्लीयरेंस जांच संपन्न</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>सरकारी ITI सर्टिफाइड ग्रेड-ए मास्टर पार्टनर</span>
              </div>
            </div>
          </div>

          {/* Verified Skills List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              सत्यापित कौशल एवं विशेषज्ञता (Verified Skills)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {worker.skills.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">{s.name}</span>
                  <span className="font-bold text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
                    {s.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              कारीगर परिचय एवं कार्य इतिहास (About Worker)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {worker.bio}
            </p>
          </div>

          {/* Service Area & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                सेवा क्षेत्र (Service Area)
              </span>
              <p className="text-slate-600">{worker.serviceArea}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                भाषाएं (Languages Known)
              </span>
              <p className="text-slate-600">{worker.languages.join(', ')}</p>
            </div>
          </div>

          {/* Full Pricing Structure */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">पारदर्शी दर सूची (Transparent Pricing)</span>
              <span className="text-[10px] text-emerald-400 font-mono">100% एस्क्रो में सुरक्षित</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-800/80 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">होम विज़िट</span>
                <span className="font-black text-white text-sm">₹{worker.pricing.visitCharge}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">प्रति घंटा</span>
                <span className="font-black text-white text-sm">₹{worker.pricing.hourlyRate}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">आपातकालीन दर</span>
                <span className="font-black text-amber-400 text-sm">₹{worker.pricing.emergencyCharge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => onDirectCall(worker)}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>सीधा कॉल करें</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onBookWorker(worker);
            }}
            className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>एस्क्रो सुरक्षा के साथ तुरंत बुक करें (₹{worker.pricing.visitCharge})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
