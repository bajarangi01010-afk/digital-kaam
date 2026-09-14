import React, { useState } from 'react';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import {
  Wrench,
  Zap,
  ShieldCheck,
  UserCheck,
  Briefcase,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { PersistentSession } from '../utils/session';

interface Props {
  lang: Language;
  onToggleLang: () => void;
  onChangeLang?: (lang: Language) => void;
  onSelectRole: (role: 'WORKER' | 'CUSTOMER') => void;
  savedSession?: PersistentSession | null;
  onResumeSession?: () => void;
  onLogoutSession?: () => void;
}

export const AnimatedLandingPage: React.FC<Props> = ({
  lang,
  onToggleLang,
  onChangeLang,
  onSelectRole,
  savedSession,
  onResumeSession,
  onLogoutSession,
}) => {
  const t = translations[lang];
  const [selectedRolePreview, setSelectedRolePreview] = useState<'WORKER' | 'CUSTOMER' | null>(null);

  const handleRoleClick = (role: 'WORKER' | 'CUSTOMER') => {
    sound.playClick();
    if (savedSession && savedSession.isLoggedIn && savedSession.role === role && onResumeSession) {
      onResumeSession();
      return;
    }
    setSelectedRolePreview(role);
    setTimeout(() => {
      onSelectRole(role);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Subtle Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with 3-Way Language Selector & Trust Indicator */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/70 border border-blue-800/60 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Dual-Trust Verified Network</span>
        </div>

        {/* Language Selector: Hindi / Hinglish / English */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 p-1 rounded-full text-xs shadow-md">
          <Globe className="w-3.5 h-3.5 text-blue-400 ml-2 mr-0.5" />
          {(
            [
              { code: 'hi' as Language, label: 'हिन्दी' },
              { code: 'hinglish' as Language, label: 'Hinglish' },
              { code: 'en' as Language, label: 'English' },
            ]
          ).map((item) => (
            <button
              key={item.code}
              onClick={() => {
                sound.playClick();
                if (onChangeLang) {
                  onChangeLang(item.code);
                } else {
                  onToggleLang();
                }
              }}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                lang === item.code
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center Animated Hero Section */}
      <div className="w-full max-w-4xl mx-auto my-auto py-10 flex flex-col items-center text-center z-10 space-y-8">
        {/* Animated Brand Logo Mark */}
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-2xl shadow-blue-500/30 flex items-center justify-center transform transition duration-500 hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center p-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
              <div className="flex items-center gap-1 text-white font-black text-3xl sm:text-4xl tracking-tighter">
                <span className="text-blue-400">D</span>
                <span className="text-cyan-300">K</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
          </div>
          {/* Subtle Orbit Badge */}
          <div className="absolute -bottom-2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-lg left-1/2 -translate-x-1/2 border-2 border-slate-950 whitespace-nowrap flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            100% Aadhaar Verified
          </div>
        </div>

        {/* App Title & Slogan */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            {lang === 'hi' ? 'डिजिटल काम' : 'Digital Kaam'}
          </h1>
          <div className="inline-block bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent text-2xl sm:text-3xl font-black tracking-wide">
            “{t.slogan}”
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t.tagline} — {lang === 'hi'
              ? 'अगर आपके पास हुनर है या घर/ऑफिस का कोई काम है, तो सीधे और सुरक्षित जुड़ें।'
              : 'Direct connection between local skilled workers and verified customers with Escrow protection.'}
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-300 max-w-xl">
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'hi' ? 'लाइव फेस व आधार सत्यापन' : 'Live Face & Aadhaar KYC'}
          </span>
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            {lang === 'hi' ? 'हैंडशेक OTP सुरक्षा' : 'Handshake Dual OTP'}
          </span>
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'hi' ? '100% ऑटो रिफंड गारंटी' : '100% No-Show Auto Refund'}
          </span>
        </div>

        {/* User Confirmation Choice: Worker vs Customer Cards */}
        <div className="w-full max-w-2xl pt-4 space-y-4">
          {/* Active Persistent Session Banner */}
          {savedSession && savedSession.isLoggedIn && (
            <div className="w-full bg-slate-900/90 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                      {lang === 'hi' ? 'सक्रिय खाता उपलब्ध' : 'Active Account'} ✓
                    </span>
                    <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                      {savedSession.role === 'WORKER'
                        ? (lang === 'hi' ? 'कारीगर' : 'Worker')
                        : (lang === 'hi' ? 'ग्राहक' : 'Customer')}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {savedSession.role === 'WORKER' ? savedSession.workerData?.name : savedSession.customerData?.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'hi'
                      ? 'आपका खाता पहले से सत्यापित है। दोबारा पंजीकरण की जरूरत नहीं है।'
                      : 'Your account is verified. Jump straight into your dashboard.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onResumeSession && onResumeSession()}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                >
                  <span>{lang === 'hi' ? 'डैशबोर्ड खोलें' : 'Open Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onLogoutSession && (
                  <button
                    onClick={onLogoutSession}
                    className="bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 font-bold text-xs px-3 py-2.5 rounded-xl transition cursor-pointer"
                    title={lang === 'hi' ? 'खाता बदलें' : 'Switch Account'}
                  >
                    {lang === 'hi' ? 'खाता बदलें' : 'Switch'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {savedSession && savedSession.isLoggedIn
              ? (lang === 'hi' ? 'या दूसरा प्रोफाइल चुनें:' : 'Or choose another profile:')
              : t.selectRole}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Continue as Worker Button Card */}
            <button
              id="continue-as-worker-btn"
              onClick={() => handleRoleClick('WORKER')}
              className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                selectedRolePreview === 'WORKER'
                  ? 'bg-blue-600/30 border-blue-400 scale-[0.98]'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                  {lang === 'hi' ? 'कारीगर' : 'Worker'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                  {t.continueAsWorker}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-400 transition" />
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.workerSubtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {lang === 'hi' ? 'दैनिक हाजिरी & आस-पास काम' : 'Daily Attendance & Nearby Gigs'}
              </div>
            </button>

            {/* Continue as Customer Button Card */}
            <button
              id="continue-as-customer-btn"
              onClick={() => handleRoleClick('CUSTOMER')}
              className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                selectedRolePreview === 'CUSTOMER'
                  ? 'bg-indigo-600/30 border-indigo-400 scale-[0.98]'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                  {lang === 'hi' ? 'ग्राहक' : 'Customer'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-1.5">
                  {t.continueAsCustomer}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-400 transition" />
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.customerSubtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {lang === 'hi' ? 'फोटो / बोलकर काम पोस्ट करें' : 'Post Kaam with Photos & Voice'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-4 gap-2 z-10">
        <div>
          © 2026 Digital Kaam (काम आसान) • All Rights Reserved.
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Aadhaar XML Secure</span>
          <span>•</span>
          <span>Escrow Vault</span>
          <span>•</span>
          <span>Made for Local India 🇮🇳</span>
        </div>
      </div>
    </div>
  );
};
