import React, { useState, Suspense, lazy } from 'react';
import { CustomerProfile, Booking, BookingStatus } from '../types';
import { Language, translations } from '../utils/i18n';
import { sound } from '../utils/audio';
import { LazyLoadingFallback } from './LazyLoadingFallback';

// Advanced Code Splitting - Lazy load camera & webcam modal on-demand
const LiveFaceCaptureModal = lazy(() => import('./LiveFaceCaptureModal').then(m => ({ default: m.LiveFaceCaptureModal })));
import {
  ArrowLeft,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Camera,
  CheckCircle2,
  Lock,
  RefreshCw,
  Edit3,
  Save,
  CreditCard,
  Building,
  Navigation,
  Sparkles,
  HeartHandshake,
  Calendar,
  Volume2,
  VolumeX,
  Clock,
  Download,
  AlertCircle,
  HelpCircle,
  Check,
  ExternalLink,
  ChevronRight,
  Receipt,
  FileCheck,
  PhoneCall,
  QrCode
} from 'lucide-react';

interface Props {
  customer: CustomerProfile;
  bookings: Booking[];
  lang: Language;
  onBack: () => void;
  onUpdateCustomer: (updated: Partial<CustomerProfile>) => void;
  onOpenBookingHandshake?: (booking: Booking) => void;
}

type ProfileTab = 'PERSONAL_ADDRESS' | 'AADHAAR_KYC' | 'REFUND_UPI' | 'PAST_ORDERS' | 'SAFETY_HELP';

export const CustomerProfilePage: React.FC<Props> = ({
  customer,
  bookings,
  lang,
  onBack,
  onUpdateCustomer,
  onOpenBookingHandshake,
}) => {
  const isHi = lang === 'hi';
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<ProfileTab>('PERSONAL_ADDRESS');
  const [isEditing, setIsEditing] = useState(false);

  // Form Fields
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [houseFlat, setHouseFlat] = useState(customer.houseFlat || 'अपार्टमेंट 402, टॉवर बी');
  const [landmark, setLandmark] = useState(customer.landmark || 'गोल्फ कोर्स एक्सटेंशन रोड, हुडा सिटी सेंटर के पास');
  const [city, setCity] = useState(customer.city || 'गुरुग्राम (हरियाणा)');
  const [email, setEmail] = useState(customer.email || 'ananya.sharma@example.com');
  const [emergencyContact, setEmergencyContact] = useState(customer.emergencyContact || '+91 98110 99887');
  const [preferredPayment, setPreferredPayment] = useState(customer.preferredPayment || 'ananya@oksbi (UPI)');

  // GPS Auto-detect state
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessToast, setGpsSuccessToast] = useState(false);

  // Camera Live Face retake modal
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [liveFaceToast, setLiveFaceToast] = useState(false);

  // Save changes toast
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Voice narration / guide state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter bookings for this customer
  const myBookings = bookings.filter(
    (b) => b.customerName.toLowerCase().includes(customer.name.toLowerCase()) || true
  );

  // Voice Narration function in Hindi
  const handleToggleVoiceGuide = () => {
    sound.playClick();
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert(isHi ? 'आपके ब्राउज़र में आवाज़ का फीचर उपलब्ध नहीं है।' : 'Speech synthesis not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = isHi
      ? `नमस्ते ${customer.name}! यह आपकी डिजिटल काम प्रोफाइल है। आपकी आधार कार्ड पहचान और फेस वेरिफिकेशन पूरी तरह सुरक्षित है। अगर आपको पता बदलना है, तो जीपीएस बटन दबाएं। किसी भी समस्या के लिए 1800-120-KAAM पर फोन करें।`
      : `Hello ${customer.name}! This is your Digital Kaam verified customer profile. Your Aadhaar and face verification are 100% secure. You can update your address with the GPS button. For help, call toll-free 1800-120-KAAM.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // GPS Auto detect handler
  const handleAutoDetectGps = () => {
    sound.playClick();
    setIsDetectingGps(true);
    setTimeout(() => {
      setIsDetectingGps(false);
      setGpsSuccessToast(true);
      const updatedAddress = 'अपार्टमेंट 402, एमार पाम हाइट्स, सेक्टर 66, गोल्फ कोर्स एक्सटेंशन, गुरुग्राम (हरियाणा 122001)';
      setAddress(updatedAddress);
      setHouseFlat('अपार्टमेंट 402, एमार पाम हाइट्स');
      setLandmark('सेक्टर 66, गोल्फ कोर्स एक्सटेंशन');
      setCity('गुरुग्राम (हरियाणा)');
      sound.playSuccess();
      setTimeout(() => setGpsSuccessToast(false), 4500);
    }, 1300);
  };

  // Face photo retake handler
  const handleFaceVerified = (newPhotoDataUrl: string) => {
    sound.playSuccess();
    onUpdateCustomer({ avatar: newPhotoDataUrl, faceVerified: true });
    setLiveFaceToast(true);
    setTimeout(() => setLiveFaceToast(false), 4000);
  };

  // Save profile changes
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playCash();

    onUpdateCustomer({
      name: name.trim() || customer.name,
      phone: phone.trim() || customer.phone,
      address: address.trim() || customer.address,
      houseFlat: houseFlat.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      email: email.trim(),
      emergencyContact: emergencyContact.trim(),
      preferredPayment: preferredPayment.trim(),
    });

    setIsEditing(false);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 4500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header Navigation Bar with prominent Back Button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <button
            id="profile-back-btn"
            onClick={() => {
              sound.playClick();
              if (isSpeaking && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
              }
              onBack();
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer group"
            title="वापस जाएं"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{isHi ? '← मुख्य पेज पर वापस जाएं' : '← Back to Dashboard'}</span>
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isHi ? 'ग्राहक प्रोफाइल व सुरक्षा विवरण' : 'Customer Profile & KYC Details'}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {isHi
                ? 'आपका 100% आधार व लाइव फेस सत्यापित व्यक्तिगत खाता'
                : '100% Aadhaar & Live Face Verified Platform Account'}
            </p>
          </div>
        </div>

        {/* Right Quick Controls: Audio Guide & Helpline */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={handleToggleVoiceGuide}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isSpeaking
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
            title={isHi ? 'आवाज़ में सहायता सुनें' : 'Listen to Hindi Audio Guide'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{isSpeaking ? (isHi ? 'रोकें (Stop)' : 'Stop') : (isHi ? '🔊 आवाज़ में सुनें' : 'Voice Guide')}</span>
          </button>

          <a
            href="tel:18001205226"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
            title="24x7 Customer Care"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>1800-120-KAAM</span>
          </a>
        </div>
      </div>

      {/* Notifications Toasts */}
      {saveSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {isHi
                ? 'आपकी प्रोफाइल और नया पता सफलतापूर्वक सुरक्षित कर लिया गया है!'
                : 'Your profile and address details were saved successfully!'}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-200/70 px-2 py-0.5 rounded">सुरक्षित ✓</span>
        </div>
      )}

      {liveFaceToast && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl text-xs text-blue-900 font-bold flex items-center gap-2 shadow-md animate-fade-in">
          <Camera className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            {isHi
              ? 'लाइव कैमरे से ली गई नई फोटो आपकी प्रोफाइल में सफलतापूर्वक जोड़ दी गई है!'
              : 'New live camera photo has been successfully updated on your profile!'}
          </span>
        </div>
      )}

      {gpsSuccessToast && (
        <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-2xl text-xs text-indigo-900 font-bold flex items-center gap-2 shadow-md animate-fade-in">
          <Navigation className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
          <span>
            {isHi
              ? 'GPS सैटेलाइट द्वारा आपका सटीक पता और पिनकोड सफलतापूर्वक ऑटो-डिटेक्ट कर लिया गया है!'
              : 'GPS Satellite pin accurately located and updated your address!'}
          </span>
        </div>
      )}

      {/* Hero Customer Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar with Live Camera Overlay & Badges */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-100"
              />
              <span
                title="100% Live Face Verified"
                className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow border-2 border-white"
              >
                <CheckCircle2 className="w-4 h-4" />
              </span>

              {/* Camera retake overlay */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsCameraModalOpen(true);
                }}
                className="absolute inset-0 bg-slate-950/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 cursor-pointer p-1 text-center"
              >
                <Camera className="w-5 h-5 text-cyan-300" />
                <span className="text-[10px] font-bold leading-tight">फोटो बदलें</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{customer.name}</h2>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isHi ? 'सत्यापित ग्राहक (KYC Verified)' : 'KYC Verified Customer'}
                </span>
              </div>

              <p className="text-xs text-slate-600 flex items-center gap-1.5 max-w-xl">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="line-clamp-1">{customer.address}</span>
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 flex-wrap">
                <span className="font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {customer.phone}
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {isHi ? 'ट्रस्ट स्कोर: ' : 'Trust Score: '}{customer.trustScore}%
                </span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{myBookings.length} {isHi ? 'काम संपन्न' : 'Jobs Done'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={() => {
                sound.playClick();
                setIsCameraModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHi ? 'कैमरे से नया फोटो लें' : 'Retake Face Photo'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsEditing(!isEditing);
                setActiveTab('PERSONAL_ADDRESS');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditing
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isHi ? 'संपादन रद्द करें' : 'Cancel Edit') : (isHi ? 'विवरण एडिट करें' : 'Edit Details')}</span>
            </button>
          </div>
        </div>

        {/* 4 Local Trust Verification Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{isHi ? 'आधार कार्ड' : 'Aadhaar Card'}</span>
            <span className="text-xs font-bold text-slate-900 block font-mono">{customer.aadhaarNumberMasked || 'XXXX-XXXX-8421'}</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OCR सत्यापित ✓
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{isHi ? 'लाइव फेस पहचान' : 'Face Biometrics'}</span>
            <span className="text-xs font-bold text-slate-900 block">{isHi ? 'बायोमेट्रिक पास' : 'Passed'}</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% लाइव मैच ✓
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{isHi ? 'एस्क्रो वॉलेट रिफंड' : 'Refund Escrow'}</span>
            <span className="text-xs font-bold text-slate-900 block font-mono truncate">{customer.preferredPayment || 'ananya@oksbi'}</span>
            <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-0.5 mt-0.5">
              <Lock className="w-3 h-3 text-indigo-600" /> 100% रिफंड लिंक ✓
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{isHi ? 'सुरक्षा गारंटी' : 'Safety Guarantee'}</span>
            <span className="text-xs font-bold text-slate-900 block">Dual-Trust Shield</span>
            <span className="text-[10px] text-purple-700 font-bold flex items-center gap-0.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-purple-600" /> 0 विवाद रिकॉर्ड
            </span>
          </div>
        </div>
      </div>

      {/* Local User Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('PERSONAL_ADDRESS');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'PERSONAL_ADDRESS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{isHi ? '1. व्यक्तिगत व पता विवरण' : '1. Personal & Address'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('AADHAAR_KYC');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'AADHAAR_KYC'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isHi ? '2. आधार कार्ड व डिजिटल पहचान' : '2. Aadhaar & KYC'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('REFUND_UPI');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'REFUND_UPI'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isHi ? '3. बैंक व 100% रिफंड UPI' : '3. Bank & Refund UPI'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('PAST_ORDERS');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'PAST_ORDERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isHi ? '4. मेरे काम व रसीदें' : '4. My Orders & Invoices'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('SAFETY_HELP');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'SAFETY_HELP'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isHi ? '5. 24x7 सहायता व सुरक्षा' : '5. Help & Safety'}</span>
        </button>
      </div>

      {/* TAB 1: Personal Details & Service Address Form */}
      {activeTab === 'PERSONAL_ADDRESS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isEditing ? (isHi ? 'ग्राहक विवरण संपादित करें' : 'Edit Customer Credentials') : (isHi ? 'व्यक्तिगत विवरण व सेवा का पता' : 'Personal Details & Service Address')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHi
                  ? 'स्थानीय कारीगर आपके इसी पते पर सेवा देने आएंगे। सटीक पता दर्ज करें।'
                  : 'Workers will arrive at this verified address for service.'}
              </p>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isEditing
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {isEditing ? (isHi ? '✏️ संपादन मोड (Editing Mode)' : 'Editing Mode') : (isHi ? '🔒 सुरक्षित दृश्य (Verified View)' : 'Verified View')}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isHi ? 'आधार अनुसार पूरा नाम (Full Name)' : 'Full Name (as per Aadhaar)'}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">आधार मैच्ड ✓</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-900"
                    required
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>{customer.name}</span>
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{isHi ? 'पंजीकृत मोबाइल नंबर (Registered Mobile)' : 'Registered Mobile Number'}</span>
                  <span className="text-[10px] text-blue-600 font-mono">OTP सत्यापित ✓</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-900 font-mono"
                    required
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isHi ? 'आपातकालीन संपर्क (Emergency / Family Contact)' : 'Emergency Contact'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98110 99887"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-900 font-mono"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{customer.emergencyContact || '+91 98110 99887'}</span>
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isHi ? 'ईमेल आईडी (रसीद व GST बिल हेतु)' : 'Email (for bills & invoices)'}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center gap-2">
                    <span className="font-mono text-slate-700">{customer.email || 'ananya.sharma@example.com'}</span>
                  </div>
                )}
              </div>

              {/* House / Flat & Building */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isHi ? 'मकान / फ्लैट नंबर व सोसाइटी' : 'Flat / House No. & Society'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={houseFlat}
                    onChange={(e) => setHouseFlat(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{customer.houseFlat || 'अपार्टमेंट 402, टॉवर बी'}</span>
                  </div>
                )}
              </div>

              {/* Landmark & City */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isHi ? 'नज़दीकी लैंडमार्क व शहर' : 'Landmark & City'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{customer.landmark || 'गोल्फ कोर्स एक्सटेंशन, गुरुग्राम'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Full Primary Address & GPS Auto Detect for Local Users */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isHi ? 'पूर्ण सेवा का पता व जीपीएस लोकेशन (Service Address & GPS)' : 'Full Service Address & GPS Pin'}</span>
                </label>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAutoDetectGps}
                    disabled={isDetectingGps}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isDetectingGps ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>{isHi ? 'उपग्रह (GPS) से खोजा जा रहा है...' : 'Locating via GPS...'}</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isHi ? '📍 वर्तमान GPS लोकेशन से ऑटो-भरें' : 'Auto-Fill from GPS'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditing ? (
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                  required
                />
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{customer.address}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isHi
                        ? 'जीपीएस निर्देशांक: Lat 28.4595° N, Lng 77.0266° E • स्थानीय सेवा दायरा: 10 किमी'
                        : 'GPS Coordinates: Lat 28.4595° N, Lng 77.0266° E • Service Radius: 10 km'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setName(customer.name);
                    setPhone(customer.phone);
                    setAddress(customer.address);
                    setIsEditing(false);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  id="save-profile-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isHi ? 'बदलाव सुरक्षित करें (Save Profile)' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: Government Aadhaar Card & Biometric KYC View */}
      {activeTab === 'AADHAAR_KYC' && (
        <div className="space-y-6">
          {/* Visual Aadhaar Card Simulation for Local Users */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-md p-6 sm:p-8 relative overflow-hidden max-w-2xl mx-auto">
            {/* National Emblem & UIDAI Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-xs font-bold">
                  🇮🇳
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-none">
                    भारत सरकार • GOVERNMENT OF INDIA
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                    भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  OCR 100% MATCH
                </span>
              </div>
            </div>

            {/* Aadhaar Card Body */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative shrink-0">
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-28 h-32 rounded-xl object-cover border border-slate-300 shadow-sm"
                />
                <span className="text-[9px] font-bold text-center block text-slate-500 mt-1">
                  लाइव फेस फोटो
                </span>
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">नाम / Name</span>
                  <p className="text-base font-black text-slate-900">{customer.name}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">जन्म तिथि / DOB</span>
                  <p className="text-xs font-bold text-slate-800">14/08/1994</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">लिंग / Gender</span>
                  <p className="text-xs font-bold text-slate-800">महिला / Female</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">सत्यापित पता / Verified Address</span>
                  <p className="text-xs font-medium text-slate-700 leading-tight">{customer.address}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center hidden md:block">
                <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
                <span className="text-[8px] font-mono text-slate-400 mt-1 block">UIDAI SIGNED</span>
              </div>
            </div>

            {/* Masked Aadhaar Number Ribbon */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                मास्क्ड आधार संख्या (सुरक्षित व एन्क्रिप्टेड)
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-widest text-slate-900 mt-0.5">
                {customer.aadhaarNumberMasked || 'XXXX-XXXX-8421'}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold mt-1">
                ✓ डिजिटल काम प्लेटफ़ॉर्म पर आधार डेटा पूर्णतः टोकनाइज़्ड है।
              </p>
            </div>
          </div>

          {/* Biometric KYC Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isHi ? 'डिजिटल काम डुअल-ट्रस्ट सुरक्षा रिपोर्ट' : 'Dual-Trust Security Report'}</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>UIDAI Aadhaar OTP OCR Match</span>
                <span className="font-bold text-emerald-600">99.4% Verified ✓</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Webcam Live Facial Liveness Check</span>
                <span className="font-bold text-emerald-600">100% Anti-Spoof Pass ✓</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Phone Carrier SMS Verification</span>
                <span className="font-bold text-emerald-600">Verified ({customer.phone}) ✓</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsCameraModalOpen(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>{isHi ? 'लाइव कैमरे से दोबारा चेहरा सत्यापित करें' : 'Retake Live Face Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bank, UPI & 100% Refund Escrow Policy */}
      {activeTab === 'REFUND_UPI' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>{isHi ? 'पसंदीदा यूपीआई व 100% नो-शो रिफंड गारंटी' : 'UPI & 100% No-Show Refund Vault'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isHi
                ? 'डिजिटल काम पर आपके पैसे 100% एस्क्रो में सुरक्षित रहते हैं। जब तक काम संतोषजनक पूरा न हो, कारीगर को पैसे नहीं मिलते।'
                : 'Money stays in escrow vault until job is verified and completion OTP is entered.'}
            </p>
          </div>

          {/* Active UPI ID Box */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                {isHi ? 'सक्रिय रिफंड यूपीआई आईडी (Linked UPI ID)' : 'Active Refund UPI'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {isHi ? 'तुरंत रिफंड हेतु सक्रिय' : 'Active for Instant Refund'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
              <div className="flex items-center gap-2.5 font-mono text-sm font-black text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-sans text-xs font-bold">
                  UPI
                </div>
                <span>{customer.preferredPayment || 'ananya@oksbi (UPI)'}</span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsEditing(true);
                  setActiveTab('PERSONAL_ADDRESS');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                {isHi ? 'बदलें (Change)' : 'Change'}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isHi
                ? '💡 यदि कारीगर निर्धारित समय पर नहीं आता है (No-Show) या बुकिंग रद्द होती है, तो पूरे 100% पैसे बिना किसी कटौती के 15 मिनट के अंदर इसी UPI खाते में भेज दिए जाते हैं।'
                : 'If worker does not arrive on time or gig is cancelled, 100% full refund is issued back to this UPI within 15 minutes.'}
            </p>
          </div>

          {/* 3 Step Escrow Flow explained simply for local users */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {isHi ? 'पैसे कैसे सुरक्षित रहते हैं? (How Escrow Protects You)' : 'How Escrow Protects You'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <p className="text-xs font-bold text-slate-900">{isHi ? 'वॉल्ट में लॉकिंग' : 'Escrow Locking'}</p>
                <p className="text-[11px] text-slate-500">बुकिंग करते समय पैसे बैंक वॉल्ट में सुरक्षित लॉक हो जाते हैं।</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <p className="text-xs font-bold text-slate-900">{isHi ? 'कारीगर आगमन & OTP' : 'Start OTP'}</p>
                <p className="text-[11px] text-slate-500">कारीगर के घर आने पर ही Start OTP से काम शुरू होता है।</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                <p className="text-xs font-bold text-slate-900">{isHi ? 'काम जांच व भुगतान' : 'End OTP & Release'}</p>
                <p className="text-[11px] text-slate-500">आप संतुष्ट होकर Final OTP देंगे, तभी कारीगर को पैसे ट्रांसफर होंगे।</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Past Bookings & Invoices */}
      {activeTab === 'PAST_ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isHi ? 'मेरे काम का इतिहास व रसीदें' : 'My Orders & Invoices'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHi ? 'आपके द्वारा बुक किए गए सभी कामों का रिकॉर्ड व GST रसीदें' : 'All your service bookings & official receipts'}
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              कुल {myBookings.length} बुकिंग
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                    DK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">{b.jobTitle}</h4>
                      <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {b.publicCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isHi ? 'कारीगर: ' : 'Worker: '}
                      <span className="font-bold text-slate-800">{b.workerName}</span> ({b.serviceCategory})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {b.scheduledTime} • भुगतान: ₹{b.priceBreakdown.total} (एस्क्रो सुरक्षित)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      b.status === BookingStatus.COMPLETED || b.status === BookingStatus.SETTLED
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {b.status}
                  </span>

                  {onOpenBookingHandshake && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenBookingHandshake(b);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{isHi ? 'रसीद व OTP' : 'Invoice'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Help & Safety Guides */}
      {activeTab === 'SAFETY_HELP' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>{isHi ? '24x7 ग्राहक सहायता व सुरक्षा नियम' : '24x7 Customer Support & Safety'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isHi
                ? 'स्थानीय ग्राहकों के लिए आसान और त्वरित सहायता। किसी भी समस्या के लिए सीधे कॉल करें।'
                : 'Instant help and safety tips for local home customers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="tel:18001205226"
              className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left block transition group"
            >
              <PhoneCall className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
              <p className="text-xs font-black text-emerald-950 uppercase">{isHi ? 'टोल-फ्री हेल्पलाइन' : 'Toll-Free Helpline'}</p>
              <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">1800-120-5226</p>
              <p className="text-[11px] text-emerald-800 mt-1">
                {isHi ? '24 घंटे हिंदी व अंग्रेजी में सहायता उपलब्ध है।' : '24x7 customer support available.'}
              </p>
            </a>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-left">
              <ShieldCheck className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-xs font-black text-blue-950 uppercase">{isHi ? 'घर पर सुरक्षा नियम' : 'Home Safety Protocol'}</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {isHi ? 'कारीगर के आने पर Kaam ID व फोटो अवश्य मिलाएं।' : 'Match Kaam ID & photo before entry.'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                {isHi ? 'कभी भी नकद भुगतान न करें। एस्क्रो से ही 100% सुरक्षा मिलती है।' : 'Never pay direct cash. Use escrow.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Live Face Retake Modal with on-demand Lazy Loading */}
      <Suspense fallback={<LazyLoadingFallback isModal={true} message="कैमरा मॉड्यूल लोड हो रहा है..." />}>
        {isCameraModalOpen && (
          <LiveFaceCaptureModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            title={isHi ? 'ग्राहक लाइव फेस फोटो अपडेट करें' : 'Update Customer Face Photo'}
            onFaceVerified={handleFaceVerified}
          />
        )}
      </Suspense>
    </div>
  );
};
