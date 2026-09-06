/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar, NavSection } from './components/Sidebar';
import { LazyLoadingFallback } from './components/LazyLoadingFallback';
import { smartBrainApi } from './services/smartBrainApi';

// Advanced Code Splitting & On-Demand Lazy Loading
const CustomerDashboardView = lazy(() => import('./components/CustomerDashboardView').then(m => ({ default: m.CustomerDashboardView })));
const CustomerProfileSection = lazy(() => import('./components/CustomerProfileSection').then(m => ({ default: m.CustomerProfileSection })));
const CustomerProfilePage = lazy(() => import('./components/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })));
const WorkerDashboardView = lazy(() => import('./components/WorkerDashboardView').then(m => ({ default: m.WorkerDashboardView })));
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const MarketplaceView = lazy(() => import('./components/MarketplaceView').then(m => ({ default: m.MarketplaceView })));
const ActiveGigsView = lazy(() => import('./components/ActiveGigsView').then(m => ({ default: m.ActiveGigsView })));
const PaymentsEscrowView = lazy(() => import('./components/PaymentsEscrowView').then(m => ({ default: m.PaymentsEscrowView })));
const VerificationQueue = lazy(() => import('./components/VerificationQueue').then(m => ({ default: m.VerificationQueue })));
const DisputesAuditView = lazy(() => import('./components/DisputesAuditView').then(m => ({ default: m.DisputesAuditView })));
const FlutterMobileSimulator = lazy(() => import('./components/FlutterMobileSimulator').then(m => ({ default: m.FlutterMobileSimulator })));
const FlutterCodeViewer = lazy(() => import('./components/FlutterCodeViewer').then(m => ({ default: m.FlutterCodeViewer })));
const PostJobModal = lazy(() => import('./components/PostJobModal').then(m => ({ default: m.PostJobModal })));
const EscrowBookingModal = lazy(() => import('./components/EscrowBookingModal').then(m => ({ default: m.EscrowBookingModal })));
const HandshakeOtpModal = lazy(() => import('./components/HandshakeOtpModal').then(m => ({ default: m.HandshakeOtpModal })));
const AnimatedLandingPage = lazy(() => import('./components/AnimatedLandingPage').then(m => ({ default: m.AnimatedLandingPage })));
const WorkerRegistrationFlow = lazy(() => import('./components/WorkerRegistrationFlow').then(m => ({ default: m.WorkerRegistrationFlow })));
const CustomerRegistrationFlow = lazy(() => import('./components/CustomerRegistrationFlow').then(m => ({ default: m.CustomerRegistrationFlow })));

import {
  INITIAL_WORKERS,
  INITIAL_BOOKINGS,
  INITIAL_POSTED_JOBS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DISPUTES,
  DEFAULT_CUSTOMER,
} from './data/mockData';
import {
  WorkerProfile,
  CustomerProfile,
  Booking,
  BookingStatus,
  PostedJob,
  AuditLogItem,
  DisputeItem,
  VerificationLevel,
} from './types';
import { translations, Language } from './utils/i18n';
import { sound } from './utils/audio';
import {
  Zap,
  Wrench,
  ShieldCheck,
  User,
  Briefcase,
  Globe,
  Home,
  Menu,
  X,
  Smartphone,
  Plus,
  Edit3,
  Store,
  CreditCard,
  Scale
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('hi');
  const [activeSection, setActiveSection] = useState<NavSection>('CUSTOMER_PORTAL');
  const [previousSection, setPreviousSection] = useState<NavSection>('CUSTOMER_PORTAL');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active models & data
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);
  const [activeWorker, setActiveWorker] = useState<WorkerProfile>(INITIAL_WORKERS[0]);
  const [customer, setCustomer] = useState<CustomerProfile>(DEFAULT_CUSTOMER);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>(INITIAL_POSTED_JOBS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time synchronization with Smart Brain Engine
  useEffect(() => {
    let active = true;
    const syncWithSmartBrain = async () => {
      try {
        const [brainWorkers, brainJobs] = await Promise.all([
          smartBrainApi.getWorkers(),
          smartBrainApi.getPostedJobs(),
        ]);
        if (active) {
          if (brainWorkers && brainWorkers.length > 0) {
            setWorkers(brainWorkers);
          }
          if (brainJobs && brainJobs.length > 0) {
            setPostedJobs(brainJobs);
          }
        }
      } catch (err) {
        // Safe fallback to local data
      }
    };
    syncWithSmartBrain();
    return () => {
      active = false;
    };
  }, []);

  // Modals & Drawers
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [bookingWorkerModalTarget, setBookingWorkerModalTarget] = useState<WorkerProfile | null>(null);
  const [handshakeBookingTarget, setHandshakeBookingTarget] = useState<Booking | null>(null);
  const [isCornerProfileDrawerOpen, setIsCornerProfileDrawerOpen] = useState(false);

  // Welcome Landing Page opens first by default
  const [showLandingPreview, setShowLandingPreview] = useState(true);
  const [registrationMode, setRegistrationMode] = useState<'WORKER' | 'CUSTOMER' | null>(null);

  const t = translations[lang];

  // Language Toggle
  const handleToggleLang = () => {
    sound.playClick();
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  // Section Selector
  const handleSelectSection = (sec: NavSection) => {
    sound.playClick();
    if (activeSection !== 'PROFILE_DETAILS' && sec === 'PROFILE_DETAILS') {
      setPreviousSection(activeSection);
    }
    setActiveSection(sec);
    setIsMobileSidebarOpen(false);
  };

  // Open Full Dedicated Profile Details Page
  const handleOpenProfilePage = () => {
    sound.playClick();
    if (activeSection !== 'PROFILE_DETAILS') {
      setPreviousSection(activeSection);
    }
    setActiveSection('PROFILE_DETAILS');
    setIsMobileSidebarOpen(false);
  };

  // Customer updates profile (details, address, face photo)
  const handleUpdateCustomer = (updated: Partial<CustomerProfile>) => {
    setCustomer((prev) => ({ ...prev, ...updated }));
  };

  // Worker updates profile (e.g. availability)
  const handleUpdateWorker = (updated: Partial<WorkerProfile>) => {
    setActiveWorker((prev) => ({ ...prev, ...updated }));
    setWorkers((prev) =>
      prev.map((w) => (w.id === activeWorker.id ? { ...w, ...updated } : w))
    );
  };

  // Worker verification status update
  const handleUpdateWorkerVerification = (
    workerId: string,
    level: VerificationLevel,
    govtStatus: 'APPROVED' | 'IN_REVIEW' | 'REJECTED'
  ) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId ? { ...w, verificationLevel: level, govtIdStatus: govtStatus } : w
      )
    );
    handleAddAuditLog(
      'WORKER_VERIFICATION_STATUS_CHANGED',
      `WKR-${workerId}`,
      `Worker verification changed to Level ${level} with status ${govtStatus}`,
      'SUCCESS'
    );
  };

  // Worker requests a customer job
  const handleRequestJob = (jobId: string, workerObj: WorkerProfile) => {
    setPostedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const exists = job.interestedWorkers.some((w) => w.workerId === workerObj.id);
        if (exists) return job;
        return {
          ...job,
          status: 'WORKER_REQUESTED',
          interestedWorkers: [
            ...job.interestedWorkers,
            {
              workerId: workerObj.id,
              workerName: workerObj.name,
              workerKaamId: workerObj.kaamId,
              workerAvatar: workerObj.avatar,
              workerTrade: workerObj.trade,
              workerRating: workerObj.rating,
              bidAmount: job.budget,
              requestedAt: 'अभी (Just now)',
            },
          ],
        };
      })
    );
    smartBrainApi.applyForJob(jobId, workerObj).catch(() => {});
  };

  // Customer adds a new posted job
  const handleAddPostedJob = (newJob: PostedJob) => {
    setPostedJobs((prev) => [newJob, ...prev]);
    smartBrainApi.postJob(newJob).catch(() => {});
    handleAddAuditLog(
      'JOB_POSTED',
      newJob.id,
      `New job posted: "${newJob.title}" with budget ₹${newJob.budget}`,
      'SUCCESS'
    );
  };

  // Customer confirms booking with escrow
  const handleConfirmEscrowBooking = (bookingData: Partial<Booking>) => {
    const fullBooking: Booking = {
      id: `bkg-${Date.now()}`,
      publicCode: bookingData.publicCode || `DK-BKG-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: bookingData.customerName || customer.name,
      customerPhone: bookingData.customerPhone || customer.phone,
      customerAddress: bookingData.customerAddress || customer.address,
      workerId: bookingData.workerId || activeWorker.id,
      workerName: bookingData.workerName || activeWorker.name,
      workerKaamId: bookingData.workerKaamId || activeWorker.kaamId,
      serviceCategory: bookingData.serviceCategory || activeWorker.trade,
      jobTitle: bookingData.jobTitle || 'घरेलू सेवा कार्य',
      description: bookingData.description || 'Digital Kaam verified Escrow booking.',
      scheduledTime: bookingData.scheduledTime || 'आज (Today), 45 मिनट के भीतर',
      status: BookingStatus.BOOKING_CONFIRMED,
      priceBreakdown: bookingData.priceBreakdown || {
        visitCharge: 199,
        taskEstimate: 450,
        platformFee: 13,
        gstTax: 32,
        total: 694,
      },
      paymentMethod: 'UPI / Escrow',
      paymentId: bookingData.paymentId || `pay_rzp_${Date.now().toString().slice(-8)}`,
      paymentConfirmedAt: 'अभी (Just now)',
      startOtp: bookingData.startOtp || `${Math.floor(1000 + Math.random() * 9000)}`,
      completionOtp: bookingData.completionOtp || `${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '100% No-show guarantee applied.',
    };

    setBookings((prev) => [fullBooking, ...prev]);
    handleAddAuditLog(
      'ESCROW_BOOKING_LOCKED',
      fullBooking.publicCode,
      `₹${fullBooking.priceBreakdown.total} locked into Escrow Vault for ${fullBooking.workerName}`,
      'SUCCESS'
    );
  };

  // Update booking status
  const handleUpdateBookingStatus = (
    bookingId: string,
    newStatus: BookingStatus,
    notes?: string
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: newStatus,
          notes: notes || b.notes,
          jobStartedAt: newStatus === BookingStatus.IN_PROGRESS ? 'अभी शुरू हुआ' : b.jobStartedAt,
          jobCompletedAt: newStatus === BookingStatus.COMPLETED ? 'अभी पूरा हुआ' : b.jobCompletedAt,
          settledAt: newStatus === BookingStatus.SETTLED ? 'भुगतान सफल' : b.settledAt,
        };
      })
    );
    if (handshakeBookingTarget && handshakeBookingTarget.id === bookingId) {
      setHandshakeBookingTarget((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    handleAddAuditLog(
      `STATUS_TRANSITION_${newStatus}`,
      bookingId,
      notes || `Booking transitioned to ${newStatus}`,
      'SUCCESS'
    );
  };

  // Trigger 100% No-show auto refund
  const handleTriggerAutoRefund = (bookingId: string) => {
    handleUpdateBookingStatus(
      bookingId,
      BookingStatus.REFUNDED,
      '100% No-Show Guarantee refund auto-executed to customer UPI.'
    );
  };

  // Add audit log item
  const handleAddAuditLog = (
    action: string,
    bookingCode: string,
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'ALERT' = 'SUCCESS'
  ) => {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
      actor: customer.name,
      actorRole: 'CUSTOMER',
      action,
      bookingCode,
      hash: `sha256:${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      status,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Resolve dispute
  const handleResolveDispute = (disputeId: string, resolution: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId ? { ...d, status: 'REFUND_APPROVED', resolutionNote: resolution } : d
      )
    );
  };

  // 1. Initial Screen: Animated Logo Landing Page with "Digital Kaam" and "Kaam Aasan"
  if (showLandingPreview) {
    return (
      <Suspense fallback={<LazyLoadingFallback message={lang === 'hi' ? 'लैंडिंग पेज लोड हो रहा है...' : 'Loading Landing Page...'} />}>
        <AnimatedLandingPage
          lang={lang}
          onToggleLang={handleToggleLang}
          onSelectRole={(role) => {
            sound.playClick();
            setShowLandingPreview(false);
            setRegistrationMode(role);
          }}
        />
      </Suspense>
    );
  }

  // 2. Worker Mandatory Aadhaar, OTP, GPS, Live Face Match & Skills Registration Flow
  if (registrationMode === 'WORKER') {
    return (
      <Suspense fallback={<LazyLoadingFallback message={lang === 'hi' ? 'कारीगर पंजीकरण लोड हो रहा है...' : 'Loading Worker Onboarding...'} />}>
        <WorkerRegistrationFlow
          lang={lang}
          onBackToLanding={() => {
            sound.playClick();
            setRegistrationMode(null);
            setShowLandingPreview(true);
          }}
          onCompleteWorkerRegistration={(newWorker) => {
            setWorkers((prev) => [newWorker, ...prev]);
            setActiveWorker(newWorker);
            setRegistrationMode(null);
            setShowLandingPreview(false);
            setActiveSection('WORKER_PORTAL');
          }}
        />
      </Suspense>
    );
  }

  // 3. Customer Mandatory Aadhaar, OTP, GPS & Live Face Match Registration Flow
  if (registrationMode === 'CUSTOMER') {
    return (
      <Suspense fallback={<LazyLoadingFallback message={lang === 'hi' ? 'ग्राहक पंजीकरण लोड हो रहा है...' : 'Loading Customer Onboarding...'} />}>
        <CustomerRegistrationFlow
          lang={lang}
          onBackToLanding={() => {
            sound.playClick();
            setRegistrationMode(null);
            setShowLandingPreview(true);
          }}
          onCompleteCustomerRegistration={(newCustomer) => {
            setCustomer(newCustomer);
            setRegistrationMode(null);
            setShowLandingPreview(false);
            setActiveSection('CUSTOMER_PORTAL');
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {/* Universal Sticky Top Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 px-3 sm:px-6 py-2.5 border-b border-slate-800 flex items-center justify-between shadow-md select-none">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => {
              sound.playClick();
              setActiveSection('CUSTOMER_PORTAL');
            }}
            className="flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 flex items-center justify-center shadow">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-white text-base">
                <span className="text-blue-400">D</span>
                <span className="text-cyan-300">K</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-white group-hover:text-blue-400 transition">
                  {lang === 'hi' ? 'डिजिटल काम' : 'Digital Kaam'}
                </h1>
                <span className="text-[10px] bg-blue-900/80 text-blue-300 border border-blue-700 px-1.5 py-0.2 rounded font-mono hidden sm:inline">
                  {t.slogan}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">
                100% आधार व लाइव फेस सत्यापित नेटवर्क
              </span>
            </div>
          </div>
        </div>

        {/* Center: Quick Persona & Section Quick Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl">
          <button
            id="header-switch-customer-btn"
            onClick={() => handleSelectSection('CUSTOMER_PORTAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'CUSTOMER_PORTAL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ग्राहक पोर्टल (Customer)</span>
          </button>

          <button
            id="header-switch-worker-btn"
            onClick={() => handleSelectSection('WORKER_PORTAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'WORKER_PORTAL'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>कारीगर पोर्टल (Worker)</span>
          </button>

          <button
            onClick={() => handleSelectSection('MARKETPLACE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'MARKETPLACE'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>मार्केटप्लेस</span>
          </button>

          <button
            onClick={() => handleSelectSection('PAYMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'PAYMENTS'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>एस्क्रो लेज़र</span>
          </button>
        </div>

        {/* Right Tools: Customer Corner Profile Pill + Post Job + Lang Switcher */}
        <div className="flex items-center gap-2">
          {/* Post Kaam Fast CTA Button */}
          <button
            id="header-post-kaam-btn"
            onClick={() => {
              sound.playClick();
              setIsPostJobModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{lang === 'hi' ? 'काम पोस्ट करें' : 'Post Kaam'}</span>
          </button>

          {/* Corner Customer Profile Pill / Trigger - Direct Link to Separate Profile Details Page */}
          <button
            id="header-corner-profile-btn"
            onClick={handleOpenProfilePage}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/50 px-2.5 py-1 rounded-xl shadow-xs transition cursor-pointer group"
            title={lang === 'hi' ? 'मेरी प्रोफाइल व KYC का अलग पेज खोलें' : 'Open Dedicated Profile & KYC Page'}
          >
            <div className="relative shrink-0">
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-7 h-7 rounded-lg object-cover border border-emerald-400"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
            </div>
            <div className="text-left hidden xs:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white group-hover:text-blue-300 transition truncate max-w-[110px]">
                  {customer.name.split(' ')[0]}
                </span>
                <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-300 transition" />
              </div>
              <span className="text-[9px] text-emerald-400 font-mono block leading-none">
                {lang === 'hi' ? 'सत्यापित प्रोफाइल ✓' : 'Verified KYC ✓'}
              </span>
            </div>
          </button>

          {/* Mobile Simulator Shortcut */}
          <button
            onClick={() => handleSelectSection('FLUTTER_SIMULATOR')}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              activeSection === 'FLUTTER_SIMULATOR'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
            }`}
            title="Open Flutter Mobile Simulator"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden md:inline">ऐप सिम्युलेटर</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={handleToggleLang}
            className="flex items-center gap-1 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-300" />
            <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
          </button>

          {/* Landing preview trigger */}
          <button
            onClick={() => setShowLandingPreview(true)}
            title="Landing Preview"
            className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* App Body with Persistent Sidebar & Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Persistent Left Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
            customer={customer}
            onOpenProfileDrawer={handleOpenProfilePage}
            lang={lang}
          />
        </div>

        {/* Mobile Slide-out Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-72 bg-slate-900 h-full flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Digital Kaam Menu</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeSection={activeSection}
                  onSelectSection={handleSelectSection}
                  customer={customer}
                  onOpenProfileDrawer={handleOpenProfilePage}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<LazyLoadingFallback />}>
            {/* 1. Customer Dashboard & Profile (Default and Primary Customer View) */}
            {activeSection === 'CUSTOMER_PORTAL' && (
              <CustomerDashboardView
                customer={customer}
                workers={workers}
                bookings={bookings}
                postedJobs={postedJobs}
                lang={lang}
                onOpenPostJob={() => setIsPostJobModalOpen(true)}
                onBookWorker={(w) => setBookingWorkerModalTarget(w)}
                onOpenHandshake={(b) => setHandshakeBookingTarget(b)}
                onTriggerAutoRefund={handleTriggerAutoRefund}
                onUpdateCustomer={handleUpdateCustomer}
                onNavigateToProfile={handleOpenProfilePage}
              />
            )}

            {/* Dedicated Separate Customer Profile Details Page */}
            {activeSection === 'PROFILE_DETAILS' && (
              <CustomerProfilePage
                customer={customer}
                bookings={bookings}
                lang={lang}
                onBack={() => handleSelectSection(previousSection || 'CUSTOMER_PORTAL')}
                onUpdateCustomer={handleUpdateCustomer}
                onOpenBookingHandshake={(b) => setHandshakeBookingTarget(b)}
              />
            )}

            {/* 2. Worker Portal View */}
            {activeSection === 'WORKER_PORTAL' && (
              <WorkerDashboardView
                worker={activeWorker}
                postedJobs={postedJobs}
                bookings={bookings}
                lang={lang}
                onUpdateWorker={handleUpdateWorker}
                onRequestJob={handleRequestJob}
                onOpenHandshake={(b) => setHandshakeBookingTarget(b)}
              />
            )}

            {/* 3. System Overview Dashboard */}
            {activeSection === 'DASHBOARD' && (
              <DashboardView
                bookings={bookings}
                onSelectBooking={(b) => setHandshakeBookingTarget(b)}
                onViewAllGigs={() => setActiveSection('ACTIVE_GIGS')}
                onPostKaamClick={() => setIsPostJobModalOpen(true)}
                searchQuery={searchQuery}
              />
            )}

            {/* 4. Trades Marketplace */}
            {activeSection === 'MARKETPLACE' && (
              <MarketplaceView
                workers={workers}
                onSelectWorkerForBooking={(w) => setBookingWorkerModalTarget(w)}
              />
            )}

            {/* 5. Active Gigs & OTP Handshake Console */}
            {activeSection === 'ACTIVE_GIGS' && (
              <ActiveGigsView
                bookings={bookings}
                onUpdateBookingStatus={(id, st, upd) => handleUpdateBookingStatus(id, st, upd?.notes)}
                onAddAuditLog={handleAddAuditLog}
                activeRole="CUSTOMER"
              />
            )}

            {/* 6. Payments & Escrow Ledger */}
            {activeSection === 'PAYMENTS' && (
              <PaymentsEscrowView
                bookings={bookings}
                auditLogs={auditLogs}
              />
            )}

            {/* 7. Worker Verification Queue */}
            {activeSection === 'VERIFICATION' && (
              <VerificationQueue
                workers={workers}
                onUpdateWorkerVerification={handleUpdateWorkerVerification}
              />
            )}

            {/* 8. Disputes & Audit Journal */}
            {activeSection === 'DISPUTES' && (
              <DisputesAuditView
                auditLogs={auditLogs}
                disputes={disputes}
                onResolveDispute={handleResolveDispute}
              />
            )}

            {/* 9. Flutter Mobile App Simulator */}
            {activeSection === 'FLUTTER_SIMULATOR' && (
              <FlutterMobileSimulator
                workers={workers}
                bookings={bookings}
                onUpdateBookingStatus={(id, st, notes) => handleUpdateBookingStatus(id, st, notes)}
                onCreateBooking={handleConfirmEscrowBooking}
              />
            )}

            {/* 10. Flutter & Dart Code Viewer */}
            {activeSection === 'FLUTTER_CODE' && (
              <FlutterCodeViewer />
            )}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers with on-demand Lazy Loading */}
      <Suspense fallback={<LazyLoadingFallback isModal={true} />}>
        {/* 1. Corner Profile Drawer / Modal */}
        {isCornerProfileDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <CustomerProfileSection
                customer={customer}
                lang={lang}
                onUpdateCustomer={handleUpdateCustomer}
                onClose={() => setIsCornerProfileDrawerOpen(false)}
                isModalOrDrawer={true}
              />
            </div>
          </div>
        )}

        {/* 2. Customer Post a Job Modal */}
        {isPostJobModalOpen && (
          <PostJobModal
            isOpen={isPostJobModalOpen}
            onClose={() => setIsPostJobModalOpen(false)}
            lang={lang}
            customerName={customer.name}
            customerPhone={customer.phone}
            customerAddress={customer.address}
            onAddPostedJob={handleAddPostedJob}
          />
        )}

        {/* 3. Customer Direct Book with Escrow Modal */}
        {bookingWorkerModalTarget !== null && (
          <EscrowBookingModal
            isOpen={bookingWorkerModalTarget !== null}
            onClose={() => setBookingWorkerModalTarget(null)}
            worker={bookingWorkerModalTarget}
            customerName={customer.name}
            customerPhone={customer.phone}
            customerAddress={customer.address}
            lang={lang}
            onConfirmBooking={handleConfirmEscrowBooking}
          />
        )}

        {/* 4. Real Handshake OTP & ID Badge Scanner Modal */}
        {handshakeBookingTarget !== null && (
          <HandshakeOtpModal
            booking={handshakeBookingTarget}
            onClose={() => setHandshakeBookingTarget(null)}
            lang={lang}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        )}
      </Suspense>
    </div>
  );
}
