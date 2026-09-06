import React from 'react';
import {
  User,
  Briefcase,
  LayoutDashboard,
  Store,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Scale,
  Code2,
  Smartphone,
  Zap,
  UserCheck
} from 'lucide-react';
import { CustomerProfile } from '../types';

export type NavSection =
  | 'CUSTOMER_PORTAL'
  | 'PROFILE_DETAILS'
  | 'WORKER_PORTAL'
  | 'DASHBOARD'
  | 'MARKETPLACE'
  | 'ACTIVE_GIGS'
  | 'PAYMENTS'
  | 'VERIFICATION'
  | 'DISPUTES'
  | 'FLUTTER_SIMULATOR'
  | 'FLUTTER_CODE';

interface Props {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  customer?: CustomerProfile;
  onOpenProfileDrawer?: () => void;
  lang?: 'hi' | 'en';
}

export const Sidebar: React.FC<Props> = ({
  activeSection,
  onSelectSection,
  customer,
  onOpenProfileDrawer,
  lang = 'hi'
}) => {
  const isHi = lang === 'hi';

  const navItems = [
    {
      id: 'CUSTOMER_PORTAL' as NavSection,
      label: isHi ? 'ग्राहक पोर्टल' : 'Customer Portal',
      icon: Store,
      badge: 'Home'
    },
    {
      id: 'PROFILE_DETAILS' as NavSection,
      label: isHi ? 'मेरी प्रोफाइल व KYC' : 'My Profile & KYC',
      icon: UserCheck,
      badge: isHi ? 'सत्यापित' : 'Verified'
    },
    {
      id: 'WORKER_PORTAL' as NavSection,
      label: isHi ? 'कारीगर पोर्टल' : 'Worker Portal',
      icon: Briefcase,
      badge: 'Level 4'
    },
    {
      id: 'DASHBOARD' as NavSection,
      label: isHi ? 'सिस्टम ओवरव्यू' : 'System Overview',
      icon: LayoutDashboard
    },
    {
      id: 'MARKETPLACE' as NavSection,
      label: isHi ? 'कारीगर मार्केटप्लेस' : 'Trades Marketplace',
      icon: Store
    },
    {
      id: 'ACTIVE_GIGS' as NavSection,
      label: isHi ? 'सक्रिय काम व OTP' : 'Active Gigs & OTP',
      icon: Zap,
      badge: 'Live'
    },
    {
      id: 'PAYMENTS' as NavSection,
      label: isHi ? 'एस्क्रो वॉलेट व लेज़र' : 'Escrow Vault & Ledger',
      icon: CreditCard
    },
    {
      id: 'VERIFICATION' as NavSection,
      label: isHi ? 'वेरिफिकेशन क्यू' : 'Verification Queue',
      icon: ShieldCheck
    },
    {
      id: 'DISPUTES' as NavSection,
      label: isHi ? 'विवाद व ऑडिट जर्नल' : 'Disputes & Audit Logs',
      icon: Scale
    },
    {
      id: 'FLUTTER_SIMULATOR' as NavSection,
      label: isHi ? 'फ्लटर मोबाइल ऐप' : 'Flutter Mobile App',
      icon: Smartphone,
      badge: 'App'
    },
    {
      id: 'FLUTTER_CODE' as NavSection,
      label: isHi ? 'डार्ट & फ्लटर कोड' : 'Flutter & Dart Code',
      icon: Code2
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            DK
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block leading-tight">
              {isHi ? 'डिजिटल काम' : 'Digital Kaam'}
            </span>
            <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
              Dual-Trust Architecture
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id.toLowerCase()}-btn`}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isActive ? 'bg-blue-800 text-blue-200' : 'bg-slate-800 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Customer Quick Profile Footer */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={() => {
            if (onOpenProfileDrawer) onOpenProfileDrawer();
            onSelectSection('PROFILE_DETAILS');
          }}
          className="w-full text-left flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-800/80 transition cursor-pointer group"
          title={isHi ? 'प्रोफाइल पेज खोलें' : 'Open profile page'}
        >
          <div className="relative shrink-0">
            <img
              src={customer?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80'}
              alt={customer?.name || 'Customer'}
              className="w-9 h-9 rounded-lg object-cover border border-emerald-400"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition">
              {customer?.name || 'अनन्या शर्मा'}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-emerald-400 font-mono">
                {isHi ? 'सत्यापित ग्राहक (KYC)' : 'Verified KYC'}
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
