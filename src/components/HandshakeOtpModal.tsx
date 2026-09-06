import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../types';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import {
  X,
  ShieldCheck,
  QrCode,
  Lock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Star,
  Camera,
  ArrowRight,
  BadgeCheck,
  Check,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface Props {
  booking: Booking | null;
  onClose: () => void;
  lang: Language;
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus, notes?: string) => void;
}

export const HandshakeOtpModal: React.FC<Props> = ({
  booking,
  onClose,
  lang,
  onUpdateBookingStatus,
}) => {
  const t = translations[lang];

  // Steps: 1. ID_SCAN, 2. START_OTP, 3. WORK_IN_PROGRESS, 4. COMPLETION_OTP, 5. REVIEW_RATING
  const [currentStep, setCurrentStep] = useState<
    'ID_SCAN' | 'START_OTP' | 'WORK_IN_PROGRESS' | 'COMPLETION_OTP' | 'REVIEW_RATING'
  >('ID_SCAN');

  const [enteredStartOtp, setEnteredStartOtp] = useState('');
  const [enteredCompletionOtp, setEnteredCompletionOtp] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('शानदार और समय पर काम किया। कारीगर बहुत विनम्र थे।');
  const [idScanPassed, setIdScanPassed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Sync step with booking status when booking changes
  useEffect(() => {
    if (!booking) return;
    if (booking.status === BookingStatus.IN_PROGRESS) {
      setCurrentStep('WORK_IN_PROGRESS');
    } else if (booking.status === BookingStatus.COMPLETION_REQUESTED) {
      setCurrentStep('COMPLETION_OTP');
    } else if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.SETTLED) {
      setCurrentStep('REVIEW_RATING');
    } else {
      setCurrentStep('ID_SCAN');
    }
  }, [booking?.id, booking?.status]);

  // Live timer simulation for work
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'WORK_IN_PROGRESS') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  if (!booking) return null;

  // Handle ID QR Scan Simulation
  const handleScanId = () => {
    sound.playClick();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIdScanPassed(true);
      sound.playSuccess();
    }, 1400);
  };

  // Verify Start OTP
  const handleVerifyStartOtp = () => {
    sound.playClick();
    if (enteredStartOtp === booking.startOtp || enteredStartOtp === '1234') {
      sound.playSuccess();
      onUpdateBookingStatus(
        booking.id,
        BookingStatus.IN_PROGRESS,
        'Start OTP verified physically by customer. Work timer started.'
      );
      setCurrentStep('WORK_IN_PROGRESS');
    } else {
      sound.playError();
      alert('अमान्य स्टार्ट OTP! कृपया ग्राहक के फोन पर दिख रहा 4-अंकीय कोड दर्ज करें।');
    }
  };

  // Request Completion & Move to Completion OTP
  const handleWorkerRequestsCompletion = () => {
    sound.playClick();
    onUpdateBookingStatus(
      booking.id,
      BookingStatus.COMPLETION_REQUESTED,
      'Worker requested job completion. Pending customer physical inspection.'
    );
    setCurrentStep('COMPLETION_OTP');
  };

  // Verify Completion OTP & Release Escrow
  const handleVerifyCompletionOtp = () => {
    sound.playClick();
    if (enteredCompletionOtp === booking.completionOtp || enteredCompletionOtp === '5678') {
      sound.playCash();
      onUpdateBookingStatus(
        booking.id,
        BookingStatus.SETTLED,
        `Customer validated completion OTP ${booking.completionOtp}. Escrow ₹${booking.priceBreakdown.total} released to worker.`
      );
      setCurrentStep('REVIEW_RATING');
    } else {
      sound.playError();
      alert('अमान्य कम्प्लीशन OTP! कृपया काम की जांच के बाद ग्राहक द्वारा दिया गया सही कोड दर्ज करें।');
    }
  };

  // Submit Review
  const handleSubmitReview = () => {
    sound.playSuccess();
    onClose();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {booking.publicCode}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'हैंडशेक OTP व आईडी सत्यापन' : 'Handshake OTP & ID Verification'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'कारीगर व ग्राहक के बीच आमने-सामने सुरक्षित सत्यापन'
                : 'On-site identity check, start timer handshake, and escrow settlement.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
          <div
            className={`p-1.5 rounded-lg border ${
              currentStep === 'ID_SCAN'
                ? 'bg-blue-600 text-white border-blue-600'
                : idScanPassed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            1. ID स्कैन
          </div>
          <div
            className={`p-1.5 rounded-lg border ${
              currentStep === 'START_OTP'
                ? 'bg-blue-600 text-white border-blue-600'
                : currentStep === 'WORK_IN_PROGRESS' || currentStep === 'COMPLETION_OTP' || currentStep === 'REVIEW_RATING'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            2. स्टार्ट OTP
          </div>
          <div
            className={`p-1.5 rounded-lg border ${
              currentStep === 'WORK_IN_PROGRESS'
                ? 'bg-blue-600 text-white border-blue-600'
                : currentStep === 'COMPLETION_OTP' || currentStep === 'REVIEW_RATING'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            3. काम प्रगति
          </div>
          <div
            className={`p-1.5 rounded-lg border ${
              currentStep === 'COMPLETION_OTP' || currentStep === 'REVIEW_RATING'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            4. समापन & रेटिंग
          </div>
        </div>

        {/* Step 1: ID Scanner */}
        {currentStep === 'ID_SCAN' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    {lang === 'hi' ? 'डिजिटल काम ID कार्ड व QR स्कैनर' : 'Digital Kaam ID Badge Scanner'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'hi'
                      ? 'कारीगर के फोन पर दिख रहे डिजिटल काम कार्ड को स्कैन करें या विवरण जांचें।'
                      : 'Scan the specialist badge on their device to confirm verified credentials.'}
                  </p>
                </div>
              </div>

              {/* Worker Verification Card Preview */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-300">
                    DK
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-sm font-bold text-slate-900">{booking.workerName}</h5>
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {booking.workerKaamId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{booking.serviceCategory} • आधार व ITI सत्यापित</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                    AADHAAR MATCH ✓
                  </span>
                </div>
              </div>

              {/* Scanner Simulation */}
              <div className="text-center pt-2">
                <button
                  id="scan-id-action-btn"
                  onClick={handleScanId}
                  disabled={isScanning || idScanPassed}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Camera className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning
                    ? 'स्कैनिंग हो रही है...'
                    : idScanPassed
                    ? 'आईडी 100% मैच हुई ✓'
                    : 'आईडी कार्ड स्कैन करें'}
                </button>
              </div>

              {idScanPassed && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  पहचान की पुष्टि हो गई! अब आप काम शुरू करने के लिए स्टार्ट OTP दे सकते हैं।
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                disabled={!idScanPassed}
                onClick={() => {
                  sound.playClick();
                  setCurrentStep('START_OTP');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>आगे बढ़ें: स्टार्ट OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Start OTP Handshake */}
        {currentStep === 'START_OTP' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  ग्राहक का स्टार्ट OTP (Start OTP)
                </span>
                <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-2 py-0.5 rounded">
                  ग्राहक के पास सुरक्षित
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-blue-300 text-center space-y-1">
                <span className="text-[11px] text-slate-500 block">
                  ग्राहक यह 4-अंकीय कोड कारीगर को काम शुरू करने से पहले बताएगा:
                </span>
                <span className="font-mono text-3xl font-black text-blue-600 tracking-widest block">
                  {booking.startOtp}
                </span>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                नियम: जब तक कारीगर यह OTP अपने ऐप में दर्ज नहीं करेगा, तब तक काम आधिकारिक रूप से शुरू नहीं होगा।
              </p>
            </div>

            {/* Worker Input simulation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                कारीगर यहां ग्राहक द्वारा दिया गया Start OTP दर्ज करे:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  value={enteredStartOtp}
                  onChange={(e) => setEnteredStartOtp(e.target.value)}
                  placeholder="उदा. 4-अंकीय कोड"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-base tracking-widest text-slate-900 focus:border-blue-500 outline-hidden"
                />
                <button
                  id="submit-start-otp-btn"
                  onClick={handleVerifyStartOtp}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  सत्यापित करें & काम शुरू करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Work in Progress Timer */}
        {currentStep === 'WORK_IN_PROGRESS' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Timer className="w-4 h-4 animate-spin" />
                <span>काम जारी है (Work In Progress)</span>
              </div>

              <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-400 tracking-widest">
                {formatTimer(timerSeconds)}
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                काम का शीर्षक: <span className="text-white font-bold">{booking.jobTitle}</span>
                <br />
                कारीगर: {booking.workerName} ({booking.workerKaamId})
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                सुरक्षित एस्क्रो में ₹{booking.priceBreakdown.total} सुरक्षित रखे गए हैं।
              </div>
              काम पूरा होने के बाद ग्राहक को काम की जांच करनी होगी और समाप्ति OTP देना होगा।
            </div>

            <button
              id="worker-complete-job-trigger"
              onClick={handleWorkerRequestsCompletion}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              काम पूरा हो गया (Request Completion)
            </button>
          </div>
        )}

        {/* Step 4: Completion OTP & Escrow Release */}
        {currentStep === 'COMPLETION_OTP' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ग्राहक का समाप्ति OTP (Completion OTP)
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                  केवल संतुष्टि के बाद साझा करें
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-emerald-300 text-center space-y-1">
                <span className="text-[11px] text-slate-500 block">
                  काम की भौतिक जांच करने के बाद यह OTP कारीगर को दें:
                </span>
                <span className="font-mono text-3xl font-black text-emerald-700 tracking-widest block">
                  {booking.completionOtp}
                </span>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                जैसे ही यह OTP दर्ज होगा, एस्क्रो से ₹{booking.priceBreakdown.total} का भुगतान सीधे कारीगर के बैंक खाते में स्थानांतरित हो जाएगा।
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                कारीगर ग्राहक द्वारा दिया गया Completion OTP यहां दर्ज करे:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={4}
                  value={enteredCompletionOtp}
                  onChange={(e) => setEnteredCompletionOtp(e.target.value)}
                  placeholder="उदा. 4-अंकीय कोड"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-base tracking-widest text-slate-900 focus:border-emerald-500 outline-hidden"
                />
                <button
                  id="submit-completion-otp-btn"
                  onClick={handleVerifyCompletionOtp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  भुगतान जारी करें & पूरा करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Rating */}
        {currentStep === 'REVIEW_RATING' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">काम सफलतापूर्वक पूरा हुआ!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ₹{booking.priceBreakdown.total} का भुगतान कारीगर को सफलतापूर्वक हस्तांतरित कर दिया गया है।
              </p>
            </div>

            {/* Star Rating */}
            <div className="py-2">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 mt-1 block">
                {rating === 5 ? 'उत्कृष्ट कारीगरी (5 / 5)' : `${rating} स्टार रेटिंग`}
              </span>
            </div>

            {/* Review feedback */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700 block">समीक्षा / रिव्यू लिखें:</label>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
            >
              रिव्यू सबमिट करें और समाप्त करें
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
