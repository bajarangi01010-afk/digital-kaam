import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Radar,
  CreditCard,
  RotateCcw,
  PhoneCall,
  MessageSquare,
  Scale,
  X,
  CheckCircle2,
  Zap,
  Award
} from 'lucide-react';
import { Language } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultLang?: Language;
}

export const AppFeaturesGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultLang = 'hi',
}) => {
  const [lang, setLang] = useState<Language>(defaultLang);

  if (!isOpen) return null;

  const content = {
    hi: {
      title: 'डिजिटल काम — प्लेटफॉर्म फीचर्स गाइड',
      subtitle: 'सुरक्षित, पारदर्शी और सत्यापित कामगार व्यवस्था की सभी खूबियाँ',
      closeBtn: 'समझ गया / बंद करें',
      features: [
        {
          icon: Lock,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          title: '100% एस्क्रो भुगतान सुरक्षा (Escrow Vault)',
          desc: 'जब आप कारीगर बुक करते हैं, तो आपकी विजिटिंग फीस बैंक-ग्रेड एस्क्रो वॉल्ट में सुरक्षित रहती है। जब तक आप कार्य से संतुष्ट होकर End OTP साझा नहीं करते, कारीगर को भुगतान रिलीज नहीं होता।'
        },
        {
          icon: ShieldCheck,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          title: 'डबल-ओटीपी सुरक्षा हैंडशेक (Dual-OTP Handshake)',
          desc: '1. Start OTP: जब कारीगर आपके घर पहुंचे, तब काम शुरू करने के लिए दें। 2. End OTP: कार्य पूर्ण होने व गुणवत्ता जांचने के बाद ही दें। यह गलत भुगतान और फर्जीवाड़े को पूरी तरह रोकता है।'
        },
        {
          icon: Award,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          title: 'लाइव फेस बायोमेट्रिक व आधार OCR KYC',
          desc: 'प्लेटफॉर्म पर प्रत्येक कारीगर और ग्राहक का असली आधार कार्ड OCR और लाइव कैमरा सेल्फी (Liveness Detection) से 100% सत्यापित होता है।'
        },
        {
          icon: Radar,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          title: 'Google S2 जियोस्पेशियल 5km रडार',
          desc: 'सिस्टम आपके सटीक GPS लोकेशन के अनुसार 5 किमी के दायरे में उपलब्ध नजदीकी कारीगरों को तुरंत मैप और लिस्ट में दिखाता है।'
        },
        {
          icon: RotateCcw,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          title: '100% तुरंत रिफंड गारंटी (Instant Refund)',
          desc: 'यदि कारीगर समय पर नहीं पहुंचता या कोई आपात स्थिति आती है, तो एक क्लिक में आपकी राशि आपके मूल बैंक खाते / UPI में तुरंत रिफंड हो जाती है।'
        },
        {
          icon: Zap,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          title: 'पारदर्शी 90/10 स्प्लिट मैथ (Fair Split)',
          desc: 'कारीगर को उसकी मेहनत का 90% सीधे बैंक में मिलता है और केवल 10% न्यूनतम प्लेटफॉर्म संचालन शुल्क कटता है। कोई छिपा हुआ चार्ज नहीं।'
        },
        {
          icon: PhoneCall,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
          title: 'वन-टैप कॉलिंग व जीपीएस नेविगेशन',
          desc: 'सत्यापित ग्राहकों और कारीगरों के बीच सुरक्षित 1-क्लिक कॉलिंग और Google Maps टर्न-बाय-टर्न नेविगेशन सपोर्ट उपलब्ध है।'
        },
        {
          icon: MessageSquare,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          title: 'सेल्युलर SMS अलर्ट्स (Fast2SMS & Twilio)',
          desc: 'इंटरनेट न होने पर भी बुकिंग कन्फर्मेशन, स्टार्ट OTP और एंड OTP आपके सामान्य मोबाइल नंबर पर SMS द्वारा प्राप्त होते हैं।'
        },
        {
          icon: Scale,
          color: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
          title: 'क्रिप्टोग्राफिक SHA-256 लेज़र व विवाद समाधान',
          desc: 'प्रत्येक वित्तीय लेनदेन SHA-256 हैश-चेन से जुड़ा है जिससे कोई डेटा से छेड़छाड़ नहीं कर सकता। विवाद होने पर 24 घंटे में मध्यस्थता।'
        }
      ]
    },
    hinglish: {
      title: 'Digital Kaam — Platform Features Guide',
      subtitle: 'Safe, Transparent & Verified Worker Platform ke Saare Features',
      closeBtn: 'Samajh Gaya / Close',
      features: [
        {
          icon: Lock,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          title: '100% Escrow Payment Security',
          desc: 'Aapka visiting fee amount safe escrow vault mein hold rehta hai. Jab tak aap kaam complete hone ke baad End OTP nahi dete, worker ko payout nahi milta.'
        },
        {
          icon: ShieldCheck,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          title: 'Dual-OTP Security Handshake',
          desc: '1. Start OTP: Jab worker ghar pahuche kaam start karne ke liye. 2. End OTP: Kaam dekhkar satisfy hone ke baad. Zero chance of fake bookings.'
        },
        {
          icon: Award,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          title: 'Live Face Biometric & Aadhaar OCR KYC',
          desc: 'Har worker aur customer ka live selfie aur real Aadhaar card OCR verify hota hai safety and identity guarantee ke liye.'
        },
        {
          icon: Radar,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          title: 'Google S2 Proximity 5km Radar',
          desc: 'Real GPS ke according aapke 5km radius ke verified workers ko instantly list aur map par find karta hai.'
        },
        {
          icon: RotateCcw,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          title: '100% Instant Source-Route Refund',
          desc: 'Worker na aane ya booking cancel hone par 1-click mein pura paisa seedhe aapke bank account ya UPI mein refund ho jata hai.'
        },
        {
          icon: Zap,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          title: 'Transparent 90/10 Split Math',
          desc: 'Worker ko 90% direct payout milta hai aur platform sirf 10% maintenance commission charge karta hai. Zero hidden charges.'
        },
        {
          icon: PhoneCall,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
          title: '1-Tap Direct Calling & GPS Maps Navigation',
          desc: 'Customer aur worker bina kisi jhanjhat ke direct call kar sakte hain aur Google Maps routing use kar sakte hain.'
        },
        {
          icon: MessageSquare,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          title: 'Cellular Mobile SMS Alerts',
          desc: 'Offline hone par bhi OTPs aur booking updates direct mobile SMS pe receive hote hain.'
        },
        {
          icon: Scale,
          color: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
          title: 'SHA-256 Ledger Audit & Dispute Center',
          desc: 'Har transaction cryptographically sealed hota hai jisko koi tamper nahi kar sakta. Kisi bhi dikkat par instant dispute desk.'
        }
      ]
    },
    en: {
      title: 'Digital Kaam — Platform Features Guide',
      subtitle: 'Complete Guide to Verified Blue-Collar Trust & Safety Architecture',
      closeBtn: 'Got it / Close Guide',
      features: [
        {
          icon: Lock,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          title: '100% Escrow Vault Payment Security',
          desc: 'Your visiting fee remains securely held in an isolated escrow vault. Payout is released to the technician ONLY after you confirm completion with End OTP.'
        },
        {
          icon: ShieldCheck,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          title: 'Dual-OTP Security Handshake',
          desc: '1. Start OTP: Shared upon physical arrival to begin work. 2. End OTP: Shared only after you inspect the completed job. Eliminates fraud completely.'
        },
        {
          icon: Award,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          title: 'Biometric Face Match & Aadhaar OCR KYC',
          desc: 'Rigorous onboarding with automated optical character recognition on Aadhaar and live camera liveness selfie matching.'
        },
        {
          icon: Radar,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          title: 'Google S2 Geospatial 5km Proximity Radar',
          desc: 'High-speed Level 13 spatial cell indexing finds nearby electricians, plumbers, and carpenters within 5km in under 0.5ms.'
        },
        {
          icon: RotateCcw,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          title: '100% Instant Source-Route Refund',
          desc: 'If a technician cannot attend or an emergency cancellation occurs, funds are refunded 100% back to your original UPI or bank source.'
        },
        {
          icon: Zap,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          title: 'Strict 90/10 Zero-Deficit Split Math',
          desc: 'Fair transparent earnings: 90% is disbursed to the worker immediately upon completion, while 10% platform fee covers insurance and operations.'
        },
        {
          icon: PhoneCall,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
          title: '1-Tap Verified Calling & Maps Navigation',
          desc: 'Native turn-by-turn routing and direct cellular calling between customer and technician.'
        },
        {
          icon: MessageSquare,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          title: 'Cellular SMS Dispatch Engine',
          desc: 'Dual OTPs and payout alerts are transmitted directly via cellular SMS, ensuring reliability even in low network connectivity.'
        },
        {
          icon: Scale,
          color: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
          title: 'SHA-256 Ledger Audit & Automated Dispute Resolution',
          desc: 'Immutable hash-chained financial ledger with automatic tamper watchdog and 24-hour administrative arbitration.'
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{t.title}</h2>
              <p className="text-xs text-slate-400 font-medium">{t.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Language Selector Bar */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-400">अपनी भाषा चुनें / Select Language:</span>
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700">
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                lang === 'hi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLang('hinglish')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                lang === 'hinglish'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Scrollable Features Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {t.features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-600 transition space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${feat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{feat.title}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-12">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Digital Kaam 100% Verified Safe</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
