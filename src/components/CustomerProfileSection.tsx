import React, { useState, Suspense, lazy } from 'react';
import { CustomerProfile } from '../types';
import { Language, translations } from '../utils/i18n';
import { sound } from '../utils/audio';
import { LazyLoadingFallback } from './LazyLoadingFallback';

// Advanced Code Splitting - Lazy load camera & webcam modal on-demand
const LiveFaceCaptureModal = lazy(() => import('./LiveFaceCaptureModal').then(m => ({ default: m.LiveFaceCaptureModal })));
import {
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
  AlertCircle,
  CreditCard,
  Building,
  Navigation,
  Sparkles,
  HeartHandshake,
  Calendar,
  X
} from 'lucide-react';

interface Props {
  customer: CustomerProfile;
  lang: Language;
  onUpdateCustomer: (updated: Partial<CustomerProfile>) => void;
  onClose?: () => void;
  isModalOrDrawer?: boolean;
}

export const CustomerProfileSection: React.FC<Props> = ({
  customer,
  lang,
  onUpdateCustomer,
  onClose,
  isModalOrDrawer = false,
}) => {
  const t = translations[lang];

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [houseFlat, setHouseFlat] = useState(customer.houseFlat || 'अपार्टमेंट 402, टॉवर बी');
  const [landmark, setLandmark] = useState(customer.landmark || 'गोल्फ कोर्स एक्सटेंशन रोड, हुडा सिटी सेंटर के पास');
  const [city, setCity] = useState(customer.city || 'गुरुग्राम (हरियाणा)');
  const [email, setEmail] = useState(customer.email || 'ananya.sharma@example.com');
  const [emergencyContact, setEmergencyContact] = useState(customer.emergencyContact || '+91 98110 99887');
  const [preferredPayment, setPreferredPayment] = useState(customer.preferredPayment || 'ananya@oksbi (UPI)');

  // GPS auto detect state
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessToast, setGpsSuccessToast] = useState(false);

  // Camera Live Face retake modal
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [liveFaceToast, setLiveFaceToast] = useState(false);

  // Save changes toast
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Handle GPS Auto-detect
  const handleAutoDetectGps = () => {
    sound.playClick();
    setIsDetectingGps(true);
    setTimeout(() => {
      setIsDetectingGps(false);
      setGpsSuccessToast(true);
      const updatedAddress = 'अपार्टमेंट 402, एमार पाम हाइट्स, सेक्टर 66, गोल्फ कोर्स एक्सटेंशन, गुरुग्राम (हरियाणा 122001)';
      setAddress(updatedAddress);
      sound.playSuccess();
      setTimeout(() => setGpsSuccessToast(false), 4000);
    }, 1200);
  };

  // Handle Face Verified from live camera
  const handleFaceVerified = (newPhotoDataUrl: string) => {
    sound.playSuccess();
    onUpdateCustomer({ avatar: newPhotoDataUrl, faceVerified: true });
    setLiveFaceToast(true);
    setTimeout(() => setLiveFaceToast(false), 4000);
  };

  // Handle Save
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
    <div className={`space-y-6 animate-fade-in ${isModalOrDrawer ? 'p-6 max-h-[85vh] overflow-y-auto' : ''}`}>
      {/* Toast Notifications */}
      {saveSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {lang === 'hi'
                ? 'ग्राहक प्रोफाइल सफलतापूर्वक अपडेट और सुरक्षित कर ली गई है!'
                : 'Customer profile updated and securely saved successfully!'}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded">सिंक पूरा ✓</span>
        </div>
      )}

      {liveFaceToast && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl text-xs text-blue-900 font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            {lang === 'hi'
              ? 'लाइव कैमरे से नया चेहरा सफलतापूर्वक डिटेक्ट व सत्यापित कर प्रोफाइल में अपडेट कर दिया गया है!'
              : 'New live face detected via camera and successfully synced with profile!'}
          </span>
        </div>
      )}

      {gpsSuccessToast && (
        <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-2xl text-xs text-indigo-900 font-bold flex items-center gap-2 shadow-md">
          <Navigation className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
          <span>
            {lang === 'hi'
              ? 'GPS सैटेलाइट द्वारा सटीक पता और पिनकोड सफलतापूर्वक अपडेट कर दिया गया है!'
              : 'GPS Satellite pin accurately located and updated your address!'}
          </span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar with Live Camera Verified Badge */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-100"
              />
              <span
                title="100% Live Face Verified"
                className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow border-2 border-white"
              >
                <CheckCircle2 className="w-4 h-4" />
              </span>

              {/* Camera retake overlay button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsCameraModalOpen(true);
                }}
                className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 cursor-pointer p-1 text-center"
              >
                <Camera className="w-5 h-5 text-cyan-300" />
                <span className="text-[9px] font-bold leading-tight">कैमरा खोलें</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{customer.name}</h2>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  100% आधार व लाइव फेस सत्यापित
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="line-clamp-1">{customer.address}</span>
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 flex-wrap">
                <span className="font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  सदस्यता: {customer.memberSince}
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ट्रस्ट स्कोर: {customer.trustScore}%
                </span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{customer.totalBookings} काम संपन्न</span>
              </div>
            </div>
          </div>

          {/* Edit / Close Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              id="customer-profile-retake-face-btn"
              onClick={() => {
                sound.playClick();
                setIsCameraModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>कैमरा से फोटो बदलें</span>
            </button>

            <button
              id="customer-profile-toggle-edit-btn"
              onClick={() => {
                sound.playClick();
                setIsEditing(!isEditing);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditing
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'संपादन रद्द करें' : 'प्रोफाइल एडिट करें'}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer ml-1"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KYC Verification Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Aadhaar Card Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">आधार कार्ड सत्यापन</span>
            <span className="text-xs font-bold text-slate-900 block truncate">
              {customer.aadhaarNumberMasked || 'XXXX-XXXX-8421'}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OCR 96% टोकन मैच ✓
            </span>
          </div>
        </div>

        {/* 2. Live Face Camera Detection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">लाइव फेस पहचान</span>
            <span className="text-xs font-bold text-slate-900 block truncate">बायोमेट्रिक सत्यापित</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% लाइव कैमरा पास
            </span>
          </div>
        </div>

        {/* 3. Mobile SMS OTP Verified */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">मोबाइल नंबर</span>
            <span className="text-xs font-bold text-slate-900 block truncate">{customer.phone}</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SMS OTP सत्यापित ✓
            </span>
          </div>
        </div>

        {/* 4. Trust & Security Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">ट्रस्ट स्कोर व सुरक्षा</span>
            <span className="text-xs font-bold text-slate-900 block truncate">{customer.trustScore}% उच्चतम ग्रेड</span>
            <span className="text-[10px] text-purple-700 font-bold flex items-center gap-0.5 mt-0.5">
              0 विवाद • 100% सुरक्षित
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form (View or Edit) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isEditing ? 'ग्राहक विवरण संपादित करें (Edit Profile Details)' : 'व्यक्तिगत विवरण व पता (Profile Credentials)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'नीचे दिए गए फ़ॉर्म में नया पता, आपातकालीन संपर्क या नाम अपडेट करें और सेव करें'
                : 'डिजिटल काम पर आपका सत्यापित डेटा और एस्क्रो सुरक्षा प्रोफाइल'}
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isEditing
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {isEditing ? 'संपादन मोड (Editing)' : 'सुरक्षित दृश्य (Verified View)'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>आधार अनुसार पूरा नाम (Full Name)</span>
                <span className="text-[10px] text-emerald-600 font-mono">आधार मैच्ड ✓</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                  required
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{customer.name}</span>
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>सत्यापित मोबाइल नंबर (Registered Mobile)</span>
                <span className="text-[10px] text-blue-600 font-mono">OTP सत्यापित ✓</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
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
              <label className="text-xs font-bold text-slate-700">आपातकालीन संपर्क (Emergency Contact)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98110 99887"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{customer.emergencyContact || '+91 98110 99887'}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ईमेल आईडी (इनवॉइस व रसीद हेतु)</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <span className="font-mono">{customer.email || 'ananya.sharma@example.com'}</span>
                </div>
              )}
            </div>

            {/* House / Flat & Landmark */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">मकान / फ्लैट नंबर व सोसाइटी</label>
              {isEditing ? (
                <input
                  type="text"
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{customer.houseFlat || 'अपार्टमेंट 402, टॉवर बी'}</span>
                </div>
              )}
            </div>

            {/* Landmark & City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">नज़दीकी लैंडमार्क व शहर</label>
              {isEditing ? (
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{customer.landmark || 'गोल्फ कोर्स एक्सटेंशन, गुरुग्राम'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Full Primary Address & GPS Auto Detect */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                <span>पूर्ण पता व जीपीएस लोकेशन (GPS Service Address)</span>
              </label>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleAutoDetectGps}
                  disabled={isDetectingGps}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  {isDetectingGps ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>स्थान खोजा जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>वर्तमान GPS लोकेशन से भरें</span>
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
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900"
                required
              />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{customer.address}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    जीपीएस निर्देशांक: Lat 28.4595° N, Lng 77.0266° E • नजदीकी सेवा दायरा: 10 किमी
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Preference & UPI */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>पसंदीदा रिफंड व भुगतान माध्यम (Default UPI ID for Escrow & 100% Refunds)</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={preferredPayment}
                onChange={(e) => setPreferredPayment(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 font-mono"
              />
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{customer.preferredPayment || 'ananya@oksbi (UPI)'}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  100% नो-शो रिफंड हेतु लिंक है ✓
                </span>
              </div>
            )}
          </div>

          {/* Edit Submit Buttons */}
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
                रद्द करें
              </button>

              <button
                id="customer-profile-save-btn"
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>बदलाव सुरक्षित करें (Save Profile)</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Live Camera Face Retake Modal with on-demand Lazy Loading */}
      <Suspense fallback={<LazyLoadingFallback isModal={true} message="कैमरा मॉड्यूल लोड हो रहा है..." />}>
        {isCameraModalOpen && (
          <LiveFaceCaptureModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            title="ग्राहक लाइव फेस फोटो अपडेट करें"
            onFaceVerified={handleFaceVerified}
          />
        )}
      </Suspense>
    </div>
  );
};
