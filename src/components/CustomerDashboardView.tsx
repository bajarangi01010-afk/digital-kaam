import React, { useState } from 'react';
import { CustomerProfile, WorkerProfile, Booking, BookingStatus, PostedJob } from '../types';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import { CustomerProfileSection } from './CustomerProfileSection';
import {
  MapPin,
  ShieldCheck,
  Phone,
  Sparkles,
  Calendar,
  Lock,
  RefreshCw,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  QrCode,
  DollarSign,
  ChevronRight,
  Filter,
  Eye,
  CreditCard,
  Radar,
  Briefcase,
  User,
  Edit3,
  Camera,
  Wallet,
  HelpCircle,
  FileText,
  Send,
  X,
  Plus
} from 'lucide-react';

export type CustomerTab =
  | 'NEARBY_WORKERS'
  | 'POSTED_JOBS'
  | 'ACTIVE_BOOKINGS'
  | 'PROFILE'
  | 'WALLET'
  | 'SUPPORT';

interface Props {
  customer: CustomerProfile;
  workers: WorkerProfile[];
  bookings: Booking[];
  postedJobs: PostedJob[];
  lang: Language;
  onOpenPostJob: () => void;
  onBookWorker: (worker: WorkerProfile) => void;
  onOpenHandshake: (booking: Booking) => void;
  onTriggerAutoRefund: (bookingId: string) => void;
  onUpdateCustomer?: (updated: Partial<CustomerProfile>) => void;
  onNavigateToProfile?: () => void;
}

export const CustomerDashboardView: React.FC<Props> = ({
  customer,
  workers,
  bookings,
  postedJobs,
  lang,
  onOpenPostJob,
  onBookWorker,
  onOpenHandshake,
  onTriggerAutoRefund,
  onUpdateCustomer = () => {},
  onNavigateToProfile,
}) => {
  const t = translations[lang];

  // Active Tab
  const [activeTab, setActiveTab] = useState<CustomerTab>('NEARBY_WORKERS');

  // Quick Corner Profile Drawer/Modal state
  const [isCornerProfileOpen, setIsCornerProfileOpen] = useState(false);

  // Radar & distance slider (mirroring Worker UI)
  const [locationRadarOn, setLocationRadarOn] = useState(true);
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('All');

  // Modal simulation states
  const [callingWorker, setCallingWorker] = useState<WorkerProfile | null>(null);
  const [refundAlertToast, setRefundAlertToast] = useState<string | null>(null);

  // Filter nearby workers
  const filteredWorkers = workers.filter((w) => {
    const matchesTrade =
      selectedTradeFilter === 'All' ||
      w.trade.toLowerCase().includes(selectedTradeFilter.toLowerCase());
    return matchesTrade && (locationRadarOn ? w.distanceKm <= maxDistanceKm : true);
  });

  // Customer's bookings
  const myBookings = bookings.filter(
    (b) => b.customerName.toLowerCase().includes(customer.name.toLowerCase()) || true
  );

  // Active (non-settled/cancelled) bookings count
  const activeBookingsCount = myBookings.filter(
    (b) =>
      b.status !== BookingStatus.SETTLED &&
      b.status !== BookingStatus.CANCELLED &&
      b.status !== BookingStatus.REFUNDED
  ).length;

  // Customer's posted jobs
  const myPostedJobs = postedJobs;

  // Handle direct call
  const handleDirectCall = (worker: WorkerProfile) => {
    sound.playClick();
    setCallingWorker(worker);
  };

  // Handle instant auto refund
  const handleClaimRefund = (booking: Booking) => {
    sound.playCash();
    onTriggerAutoRefund(booking.id);
    setRefundAlertToast(
      `100% No-Show Auto-Refund Successful: ₹${booking.priceBreakdown.total} has been returned to your UPI/Bank account (Txn #REF-${Date.now().toString().slice(-6)}).`
    );
    setTimeout(() => setRefundAlertToast(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast */}
      {refundAlertToast && (
        <div className="p-3.5 bg-purple-50 border border-purple-300 rounded-2xl text-xs text-purple-900 font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          <span>{refundAlertToast}</span>
        </div>
      )}

      {/* Top Banner with Corner Customer Profile Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Customer Basic Info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative group">
            <img
              src={customer.avatar}
              alt={customer.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
            />
            <span
              title="100% Live Face Verified"
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">{customer.name}</h2>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                सत्यापित ग्राहक (Trust Score: {customer.trustScore}%)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                आधार व लाइव फेस 100%
              </span>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate max-w-lg">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {customer.address}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{customer.phone}</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{myBookings.length} कुल बुकिंग</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">100% एस्क्रो सुरक्षा लागू</span>
            </div>
          </div>
        </div>

        {/* Dedicated Top-Right Corner Section: View & Edit Profile Quick Card */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          {/* Corner Profile Access Button */}
          <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl flex items-center gap-2.5 shadow-xs">
            <button
              id="customer-corner-profile-btn"
              onClick={() => {
                sound.playClick();
                if (onNavigateToProfile) {
                  onNavigateToProfile();
                } else {
                  setIsCornerProfileOpen(true);
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="प्रोफाइल देखें और संपादित करें"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>मेरी प्रोफाइल देखें / बदलें</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
            </button>

            <button
              id="customer-tab-profile-trigger"
              onClick={() => {
                sound.playClick();
                if (onNavigateToProfile) {
                  onNavigateToProfile();
                } else {
                  setActiveTab('PROFILE');
                }
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg transition cursor-pointer"
              title="पूरा प्रोफाइल सेक्शन खोलें"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Post Kaam Primary CTA */}
          <button
            id="customer-post-kaam-banner-btn"
            onClick={() => {
              sound.playClick();
              onOpenPostJob();
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.postKaamBtn}</span>
          </button>
        </div>
      </div>

      {/* Customer Navigation Bar (Mirroring Worker UI Parity) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          id="cust-tab-nearby-workers"
          onClick={() => {
            sound.playClick();
            setActiveTab('NEARBY_WORKERS');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'NEARBY_WORKERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Radar className="w-3.5 h-3.5" />
          <span>पास के कारीगर (Find Workers)</span>
        </button>

        <button
          id="cust-tab-posted-jobs"
          onClick={() => {
            sound.playClick();
            setActiveTab('POSTED_JOBS');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'POSTED_JOBS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>मेरे पोस्ट किए गए काम ({myPostedJobs.length})</span>
        </button>

        <button
          id="cust-tab-active-bookings"
          onClick={() => {
            sound.playClick();
            setActiveTab('ACTIVE_BOOKINGS');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'ACTIVE_BOOKINGS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>सक्रिय बुकिंग व हैंडशेक ({activeBookingsCount})</span>
          {activeBookingsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          id="cust-tab-profile"
          onClick={() => {
            sound.playClick();
            setActiveTab('PROFILE');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'PROFILE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>मेरी प्रोफाइल व केवाईसी (My Profile)</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">100%</span>
        </button>

        <button
          id="cust-tab-wallet"
          onClick={() => {
            sound.playClick();
            setActiveTab('WALLET');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'WALLET'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>एस्क्रो सुरक्षा व वॉलेट</span>
        </button>

        <button
          id="cust-tab-support"
          onClick={() => {
            sound.playClick();
            setActiveTab('SUPPORT');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'SUPPORT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>सुरक्षा व सहायता</span>
        </button>
      </div>

      {/* SECTION 1: NEARBY WORKERS & RADAR */}
      {activeTab === 'NEARBY_WORKERS' && (
        <div className="space-y-6">
          {/* GPS Radar Controls (Mirroring Worker UI) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Radar className={`w-5 h-5 ${locationRadarOn ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{t.customerHomeTitle}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {locationRadarOn
                        ? `जीपीएस रडार सक्रिय है • ${maxDistanceKm} किमी के दायरे में उपलब्ध कारीगर`
                        : 'रडार बंद है'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distance Slider & Toggle */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span>दायरा (Radius): {maxDistanceKm} किमी</span>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                    className="accent-indigo-600 cursor-pointer w-24 sm:w-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">रडार:</span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setLocationRadarOn(!locationRadarOn);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                      locationRadarOn ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills Tailored for Local Users */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'All', label: 'सभी कारीगर (All)', icon: '🛠️' },
                { id: 'Electrician', label: '⚡ बिजली मिस्त्री (Electrician)', icon: '⚡' },
                { id: 'Plumber', label: '🚰 नल मिस्त्री (Plumber)', icon: '🚰' },
                { id: 'Carpenter', label: '🪚 बढ़ई (Carpenter)', icon: '🪚' },
                { id: 'Painter', label: '🎨 पेंटर (Painter)', icon: '🎨' },
                { id: 'Air Cooling', label: '❄️ एसी / कूलर (AC & Cool)', icon: '❄️' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTradeFilter(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    selectedTradeFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Profile Row */}
                    <div className="flex items-start gap-4">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{worker.name}</h4>
                          <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {worker.kaamId}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">{worker.trade}</p>

                        <div className="flex items-center gap-2.5 mt-1.5 text-xs">
                          <span className="flex items-center font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                            {worker.rating}
                          </span>
                          <span className="text-slate-400">({worker.reviewCount} समीक्षाएं)</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                            आधार व फेस सत्यापित ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {worker.bio}
                    </p>

                    {/* Distance & Area */}
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {worker.serviceArea}
                      </span>
                      <span className="text-blue-600 font-bold shrink-0">{worker.distanceKm} किमी दूर</span>
                    </div>
                  </div>

                  {/* Pricing & CTAs */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 block">विज़िट शुल्क:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-slate-900">₹{worker.pricing.visitCharge}</span>
                        <span className="text-[11px] text-slate-500">+ ₹{worker.pricing.hourlyRate}/घंटा</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id={`direct-call-${worker.id}-btn`}
                        onClick={() => handleDirectCall(worker)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {t.directCall}
                      </button>

                      <button
                        id={`direct-book-${worker.id}-btn`}
                        onClick={() => {
                          sound.playClick();
                          onBookWorker(worker);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {t.directBook}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: POSTED JOBS & APPLICANT BIDS */}
      {activeTab === 'POSTED_JOBS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">मेरे द्वारा पोस्ट किए गए काम</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                आस-पास के सत्यापित कारीगरों द्वारा भेजे गए आवेदन और बोलियां (Bids) देखें
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onOpenPostJob();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नया काम पोस्ट करें</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {myPostedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {job.category}
                      </span>
                      <span className="text-xs text-slate-400">पोस्ट किया गया: {job.postedAt}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{job.title}</h4>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">निर्धारित बजट (Escrow Budget)</span>
                    <span className="text-lg font-black text-slate-900">₹{job.budget}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{job.description}</p>

                {/* Interested workers who applied */}
                <div className="pt-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    आवेदन करने वाले कारीगर ({job.interestedWorkers.length})
                  </h5>

                  {job.interestedWorkers.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      रडार पर आस-पास के कारीगरों को नोटिफिकेशन भेजा गया है। आवेदन आते ही यहां दिखाई देंगे।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.interestedWorkers.map((workerBid) => (
                        <div
                          key={workerBid.workerId}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={workerBid.workerAvatar}
                              alt={workerBid.workerName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">{workerBid.workerName}</span>
                                <span className="font-mono text-[10px] text-blue-600">({workerBid.workerKaamId})</span>
                              </div>
                              <p className="text-[11px] text-slate-500">{workerBid.workerTrade}</p>
                              <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {workerBid.workerRating}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 block">₹{workerBid.bidAmount}</span>
                            <button
                              onClick={() => {
                                sound.playClick();
                                const target = workers.find((w) => w.id === workerBid.workerId) || workers[0];
                                onBookWorker(target);
                              }}
                              className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                            >
                              स्वीकारें व बुक करें
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ACTIVE BOOKINGS & ESCROW HANDSHAKE */}
      {activeTab === 'ACTIVE_BOOKINGS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">सक्रिय बुकिंग व एस्क्रो स्थिति</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              100% नो-शो रिफंड सुरक्षित
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border-2 border-blue-500 shadow-md p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {b.publicCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      b.status === BookingStatus.REFUNDED
                        ? 'bg-purple-100 text-purple-800'
                        : b.status === BookingStatus.SETTLED
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.jobTitle}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    नियुक्त कारीगर: <span className="font-bold text-slate-800">{b.workerName}</span>{' '}
                    <span className="font-mono text-blue-600">({b.workerKaamId})</span>
                  </p>
                </div>

                {/* OTP Display for Customer */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                    <span className="text-[10px] text-slate-500 block">शुरुआती कोड (Start OTP):</span>
                    <span className="font-mono text-lg font-black text-blue-600 tracking-wider">
                      {b.startOtp}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">पहुंचने पर कारीगर को दें</span>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-slate-500 block">समाप्ति कोड (Completion OTP):</span>
                    <span className="font-mono text-lg font-black text-emerald-700 tracking-wider">
                      {b.completionOtp}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">काम जांचने के बाद दें</span>
                  </div>
                </div>

                {/* Escrow Amount Held */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">एस्क्रो में सुरक्षित राशि:</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{b.priceBreakdown.total}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">ID: {b.paymentId}</span>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {b.status !== BookingStatus.SETTLED && b.status !== BookingStatus.REFUNDED && (
                    <button
                      id={`claim-refund-${b.id}-btn`}
                      onClick={() => handleClaimRefund(b)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      100% नो-शो रिफंड लें
                    </button>
                  )}

                  <button
                    id={`open-handshake-${b.id}-btn`}
                    onClick={() => {
                      sound.playClick();
                      onOpenHandshake(b);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    ID स्कैन & OTP हैंडशेक
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: MY PROFILE & EDIT SECTION */}
      {activeTab === 'PROFILE' && (
        <CustomerProfileSection
          customer={customer}
          lang={lang}
          onUpdateCustomer={onUpdateCustomer}
        />
      )}

      {/* SECTION 5: ESCROW WALLET & TRANSACTION LEDGER */}
      {activeTab === 'WALLET' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">डिजिटल काम एस्क्रो सुरक्षा व वॉलेट</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  आपकी प्रत्येक बुकिंग का 100% भुगतान कार्य पूर्ण होने तक सुरक्षित एस्क्रो खाते में जमा रहता है
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
                0% हिडन फीस • 100% रिफंड गारंटी
              </span>
            </div>

            {/* Escrow Balance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">सक्रिय एस्क्रो में सुरक्षित</span>
                <span className="text-xl font-black text-blue-600 mt-1 block">₹694.00</span>
                <span className="text-[10px] text-slate-400 mt-1 block">कार्य संतुष्टि के बाद ही रिलीज</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">सफलतापूर्वक सेटल किया गया</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">₹4,250.00</span>
                <span className="text-[10px] text-slate-400 mt-1 block">कारीगरों को भुगतान पूर्ण</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">नो-शो ऑटो-रिफंड प्राप्त</span>
                <span className="text-xl font-black text-purple-600 mt-1 block">₹499.00</span>
                <span className="text-[10px] text-slate-400 mt-1 block">सीधे बैंक/UPI में वापस</span>
              </div>
            </div>

            {/* Escrow Terms */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>डिजिटल काम की ग्राहक सुरक्षा नीति (Customer Protection Policy):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 ml-1">
                <li>कारीगर द्वारा काम शुरू करने से पहले कोई भी राशि उसके खाते में नहीं जाती।</li>
                <li>जब तक आप समाप्ति OTP (Completion OTP) साझा नहीं करते, भुगतान रिलीज नहीं होता।</li>
                <li>कारीगर के 30 मिनट तक न पहुंचने पर 1-क्लिक में 100% पूर्ण रिफंड जारी होता है।</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: SUPPORT & DISPUTE */}
      {activeTab === 'SUPPORT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b pb-4 border-slate-100">
            <h3 className="text-base font-black text-slate-900">ग्राहक सुरक्षा व शिकायत निवारण (Safety & Support)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              किसी भी असुविधा या विवाद की स्थिति में तुरंत डिजिटल काम मध्यस्थता टीम से संपर्क करें
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">24x7 ग्राहक सुरक्षा हेल्पलाइन</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                टोल-फ्री हेल्पलाइन: <span className="font-bold text-blue-700 font-mono">1800-889-KAAM</span> (1800-889-5226)
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold block">औसत प्रतीक्षा समय: &lt; 45 सेकंड</span>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">विवाद या शिकायत दर्ज करें</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                यदि कारीगर ने अतिरिक्त शुल्क मांगा या कार्य मानकों के अनुसार नहीं था, तो तुरंत एस्क्रो होल्ड लगाएं।
              </p>
              <button
                onClick={() => {
                  sound.playClick();
                  alert('आपकी शिकायत दर्ज कर ली गई है। हमारी टीम 15 मिनट के भीतर आपसे संपर्क करेगी।');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                तुरंत शिकायत दर्ज करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Call Simulation Modal */}
      {callingWorker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">{callingWorker.name}</h4>
              <p className="text-xs text-slate-500">{callingWorker.trade} • {callingWorker.kaamId}</p>
              <p className="font-mono text-base font-bold text-blue-600 mt-2">+91 98765 43210</p>
            </div>

            <p className="text-xs text-slate-400">
              डिजिटल काम सुरक्षित कॉलिंग: आपका व्यक्तिगत नंबर पूरी तरह सुरक्षित और एन्क्रिप्टेड है।
            </p>

            <div className="flex gap-2 pt-2">
              <a
                href="tel:+919876543210"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                कॉल लगाएं
              </a>
              <button
                onClick={() => setCallingWorker(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Corner Profile Slide-over / Modal */}
      {isCornerProfileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <CustomerProfileSection
              customer={customer}
              lang={lang}
              onUpdateCustomer={onUpdateCustomer}
              onClose={() => setIsCornerProfileOpen(false)}
              isModalOrDrawer={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
