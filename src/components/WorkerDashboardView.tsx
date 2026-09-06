import React, { useState } from 'react';
import { WorkerProfile, PostedJob, Booking, BookingStatus } from '../types';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import {
  ShieldCheck,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Power,
  Calendar,
  Radar,
  Send,
  Sparkles,
  Phone,
  User,
  Star,
  Lock,
  ArrowRight,
  BadgeCheck,
  Volume2
} from 'lucide-react';

interface Props {
  worker: WorkerProfile;
  postedJobs: PostedJob[];
  bookings: Booking[];
  lang: Language;
  onUpdateWorker: (updated: Partial<WorkerProfile>) => void;
  onRequestJob: (jobId: string, worker: WorkerProfile) => void;
  onOpenHandshake: (booking: Booking) => void;
}

export const WorkerDashboardView: React.FC<Props> = ({
  worker,
  postedJobs,
  bookings,
  lang,
  onUpdateWorker,
  onRequestJob,
  onOpenHandshake,
}) => {
  const t = translations[lang];

  const [isAvailable, setIsAvailable] = useState(worker.isAvailable ?? true);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);
  const [radarActive, setRadarActive] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState(5);
  const [requestedJobIds, setRequestedJobIds] = useState<string[]>([]);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Toggle availability
  const handleToggleAvailability = () => {
    sound.playClick();
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    onUpdateWorker({ isAvailable: nextState });
  };

  // Daily attendance check-in
  const handleDailyCheckIn = () => {
    sound.playSuccess();
    setHasCheckedInToday(true);
    setNotificationToast('आज की उपस्थिति (Attendance) सफलतापूर्वक दर्ज कर ली गई है! हाजिरी स्ट्रीक: 15 दिन ✓');
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Worker requests a job
  const handleApply = (job: PostedJob) => {
    sound.playSuccess();
    setRequestedJobIds((prev) => [...prev, job.id]);
    onRequestJob(job.id, worker);
    setNotificationToast(`काम "${job.title}" के लिए ग्राहक को रिक्वेस्ट भेज दी गई है!`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Filter nearby jobs
  const relevantJobs = postedJobs.filter((j) => {
    return j.distanceKm <= maxDistanceKm;
  });

  // Active bookings where this worker is assigned
  const myActiveBookings = bookings.filter(
    (b) =>
      b.workerKaamId === worker.kaamId &&
      b.status !== BookingStatus.SETTLED &&
      b.status !== BookingStatus.CANCELLED &&
      b.status !== BookingStatus.REFUNDED
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast message */}
      {notificationToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Banner: Worker Profile Card with Availability & Attendance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Worker Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">{worker.name}</h2>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {worker.kaamId}
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                आधार व फेस 100% सत्यापित
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {worker.trade} • {worker.experienceYears} वर्ष का अनुभव • विज़िट दर: ₹{worker.pricing.visitCharge}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                {worker.rating}
              </span>
              <span className="text-slate-400">({worker.jobsCompleted} काम पूरे किए)</span>
              <span className="text-blue-600 font-semibold">• {worker.onTimeRate}% समयबद्धता (On-Time)</span>
            </div>
          </div>
        </div>

        {/* Controls: Availability Switch + Daily Attendance */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          {/* Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Power className={`w-3.5 h-3.5 ${isAvailable ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{isAvailable ? t.availableForWork : t.unavailable}</span>
          </button>

          {/* Daily Attendance */}
          <button
            onClick={handleDailyCheckIn}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              hasCheckedInToday
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{hasCheckedInToday ? t.checkedIn : t.checkInToday}</span>
          </button>
        </div>
      </div>

      {/* Active Work In Hand / Handshake Status (If any active gig) */}
      {myActiveBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            वर्तमान सक्रिय काम (Active Handshake Gigs)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border-2 border-blue-500 shadow-md p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {b.publicCode}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.jobTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ग्राहक: {b.customerName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {b.customerAddress}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">एस्क्रो में सुरक्षित:</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{b.priceBreakdown.total}</span>
                  </div>
                  <button
                    onClick={() => onOpenHandshake(b)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>OTP हैंडशेक कंसोल खोलें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Powerful Location System (GPS Nearby Jobs Radar) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Radar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Radar className={`w-5 h-5 ${radarActive ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{t.nearbyJobsRadar}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {radarActive ? t.radarActive : 'रडार बंद है'}
                </p>
              </div>
            </div>
          </div>

          {/* Radar Distance Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">दायरा (Radius): {maxDistanceKm} किमी</span>
            <input
              type="range"
              min={1}
              max={15}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Nearby Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>दिखाए जा रहे काम: {relevantJobs.length}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              सभी ग्राहकों का भुगतान व ट्रस्ट स्कोर सत्यापित
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantJobs.map((job) => {
              const hasRequested = requestedJobIds.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                          {job.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{job.title}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 block">अनुमानित बजट</span>
                        <span className="text-base font-black text-slate-900">₹{job.budget}</span>
                      </div>
                    </div>

                    {/* Image Preview if provided */}
                    {job.imageUrl && (
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200">
                        <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    {/* Voice Note Badge */}
                    {job.voiceNoteUrl && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg w-fit">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>ग्राहक की वॉइस रिकॉर्डिंग संलग्न है</span>
                      </div>
                    )}

                    {/* Customer Trust Details */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {job.customerName}
                        </span>
                        <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                          ट्रस्ट स्कोर: {job.customerTrustScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {job.customerAddress}
                        </span>
                        <span className="text-blue-600 font-bold shrink-0">{job.distanceKm} किमी दूर</span>
                      </div>
                    </div>
                  </div>

                  {/* Apply / Request Button */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">पोस्ट किया गया: {job.postedAt}</span>

                    <button
                      id={`apply-job-${job.id}-btn`}
                      disabled={hasRequested}
                      onClick={() => handleApply(job)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        hasRequested
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {hasRequested ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          रिक्वेस्ट भेजी गई ✓
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          {t.applyJob}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
