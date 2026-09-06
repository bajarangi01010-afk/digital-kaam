import React, { useState } from 'react';
import { Booking, BookingStatus, WorkerProfile } from '../types';
import {
  Smartphone,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  Award,
  AlertCircle,
  Phone,
  RefreshCw,
  Coins
} from 'lucide-react';

interface Props {
  workers: WorkerProfile[];
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus, notes?: string) => void;
  onCreateBooking: (newBooking: Partial<Booking>) => void;
}

export const FlutterMobileSimulator: React.FC<Props> = ({
  workers,
  bookings,
  onUpdateBookingStatus,
  onCreateBooking,
}) => {
  const [activeApp, setActiveApp] = useState<'CUSTOMER' | 'WORKER'>('CUSTOMER');
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(workers[0]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string>(bookings[0]?.id || '');
  const [startOtpInput, setStartOtpInput] = useState('');
  const [completionOtpInput, setCompletionOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const activeJob = bookings.find((b) => b.id === activeJobId) || bookings[0];

  const filteredWorkers = selectedTrade === 'All'
    ? workers
    : workers.filter((w) => w.trade.toLowerCase().includes(selectedTrade.toLowerCase()));

  // Simulate customer booking
  const handleConfirmBooking = () => {
    if (!selectedWorker) return;
    const newCode = `DK-BKG-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomStartOtp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const randomCompletionOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Partial<Booking> = {
      id: `bkg-${Date.now()}`,
      publicCode: newCode,
      customerName: 'Pooja Kashyap',
      customerPhone: '+91 98112 34509',
      customerAddress: 'Tower B, Green Valley, Sector 48, Gurugram',
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      workerKaamId: selectedWorker.kaamId,
      serviceCategory: selectedWorker.trade,
      jobTitle: `${selectedWorker.trade} Emergency Service & Inspection`,
      description: 'Comprehensive inspection and troubleshooting via Digital Kaam Escrow.',
      scheduledTime: 'Today, within 45 mins',
      status: BookingStatus.BOOKING_CONFIRMED,
      priceBreakdown: {
        visitCharge: selectedWorker.pricing.visitCharge,
        taskEstimate: selectedWorker.pricing.hourlyRate * 2,
        platformFee: 30,
        gstTax: 35,
        total: selectedWorker.pricing.visitCharge + (selectedWorker.pricing.hourlyRate * 2) + 65,
      },
      paymentMethod: 'UPI / Escrow',
      paymentId: `pay_rzp_${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentConfirmedAt: 'Just now',
      startOtp: randomStartOtp,
      completionOtp: randomCompletionOtp,
      notes: 'Booking locked with 100% Escrow Protection. Worker dispatched.',
    };

    onCreateBooking(newBooking);
    setIsBookingModalOpen(false);
    setActiveJobId(newBooking.id!);
  };

  // Simulate worker verifying Start OTP
  const handleWorkerVerifyStartOtp = () => {
    if (!activeJob) return;
    if (startOtpInput.trim() === activeJob.startOtp) {
      setOtpError(null);
      onUpdateBookingStatus(
        activeJob.id,
        BookingStatus.IN_PROGRESS,
        'Start OTP verified by worker. Work timer officially running.'
      );
      setStartOtpInput('');
    } else {
      setOtpError(`Invalid OTP. Please ask customer for correct 4-digit Start OTP (${activeJob.startOtp})`);
    }
  };

  // Simulate worker verifying Completion OTP
  const handleWorkerVerifyCompletionOtp = () => {
    if (!activeJob) return;
    if (completionOtpInput.trim() === activeJob.completionOtp) {
      setOtpError(null);
      onUpdateBookingStatus(
        activeJob.id,
        BookingStatus.COMPLETED,
        'Customer entered Completion OTP. Service inspected and accepted. Escrow released!'
      );
      setCompletionOtpInput('');
    } else {
      setOtpError(`Invalid OTP. Customer has not verified this Completion OTP (${activeJob.completionOtp})`);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full overflow-y-auto p-2">
      {/* Phone Simulator Left */}
      <div className="w-full xl:w-[420px] shrink-0 flex flex-col items-center">
        {/* Device Mode Switcher */}
        <div className="w-full bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between mb-4 shadow-md">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Flutter M3 Client</span>
          </div>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              id="switch-customer-app-btn"
              onClick={() => setActiveApp('CUSTOMER')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeApp === 'CUSTOMER' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer App
            </button>
            <button
              id="switch-worker-app-btn"
              onClick={() => setActiveApp('WORKER')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeApp === 'WORKER' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Worker App
            </button>
          </div>
        </div>

        {/* Mobile Mockup Frame */}
        <div className="w-[370px] h-[720px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
          {/* Top Speaker & Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
            <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
          </div>

          {/* Internal Mobile Screen */}
          <div className="w-full h-full bg-slate-50 rounded-[34px] overflow-hidden flex flex-col relative text-slate-800 font-sans">
            {/* Status Bar */}
            <div className="h-7 bg-slate-900 text-white text-[11px] px-6 pt-1 flex items-center justify-between z-20 shrink-0 font-medium">
              <span>09:41</span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Mobile Content Area */}
            <div className="flex-1 overflow-y-auto">
              {activeApp === 'CUSTOMER' ? (
                /* CUSTOMER APP FLOW */
                <div className="flex flex-col min-h-full">
                  {/* Flutter App Bar */}
                  <div className="bg-slate-900 text-white p-4 pt-2 shadow-sm shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">
                          DK
                        </div>
                        <span className="font-bold tracking-tight text-sm">Digital Kaam</span>
                      </div>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                        Dual-Trust
                      </span>
                    </div>

                    {/* Geolocation selector */}
                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">Sector 48, Sohna Road, Gurugram</span>
                    </div>
                  </div>

                  {/* Active Job Alert Banner if any */}
                  {activeJob && activeJob.status !== BookingStatus.SETTLED && activeJob.status !== BookingStatus.COMPLETED && (
                    <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-blue-900">Active Booking: {activeJob.publicCode}</p>
                        <p className="text-[10px] text-blue-700">Status: {activeJob.status.replace(/_/g, ' ')}</p>
                      </div>
                      <button
                        onClick={() => {}}
                        className="text-[11px] font-bold text-blue-600 bg-white px-2.5 py-1 rounded shadow-sm border border-blue-200"
                      >
                        Track
                      </button>
                    </div>
                  )}

                  <div className="p-3.5 space-y-3.5">
                    {/* Trade Category Tabs */}
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verified Trades</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['All', 'Electrician', 'Plumbing', 'Carpentry', 'Cooling'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedTrade(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                              selectedTrade === cat
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Worker Cards List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Verified Specialists Nearby</span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Escrow Protected
                        </span>
                      </div>

                      {filteredWorkers.map((worker) => (
                        <div
                          key={worker.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition"
                        >
                          <div className="flex gap-3">
                            <img
                              src={worker.avatar}
                              alt={worker.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{worker.name}</h4>
                                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                  {worker.kaamId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{worker.trade}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center text-[11px] font-bold text-amber-600">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                                  {worker.rating}
                                </span>
                                <span className="text-[10px] text-slate-400">({worker.jobsCompleted} jobs)</span>
                                <span className="text-[10px] text-emerald-600 font-medium">{worker.onTimeRate}% on-time</span>
                              </div>
                            </div>
                          </div>

                          {/* Skill Passport summary */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[11px]">
                              <span className="text-slate-400">Visit Fee: </span>
                              <span className="font-bold text-slate-800">₹{worker.pricing.visitCharge}</span>
                            </div>
                            <button
                              id={`book-worker-${worker.id}-btn`}
                              onClick={() => {
                                setSelectedWorker(worker);
                                setIsBookingModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                            >
                              Book Now
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* WORKER PARTNER APP FLOW */
                <div className="flex flex-col min-h-full">
                  <div className="bg-slate-900 text-white p-4 pt-2 shadow-sm shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">
                          DK
                        </div>
                        <span className="font-bold tracking-tight text-sm">Partner Console</span>
                      </div>
                      <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ON DUTY
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">Rohan Kumar Sharma • DK-8492</p>
                  </div>

                  <div className="p-3.5 space-y-3.5">
                    {/* Worker Quick Balance */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Escrow Wallet Balance</p>
                        <h3 className="text-xl font-bold text-white mt-0.5">₹4,250.00</h3>
                        <p className="text-[10px] text-emerald-400 mt-1">Automatic UPI settlement</p>
                      </div>
                      <Coins className="w-7 h-7 text-blue-400" />
                    </div>

                    {/* Active Assignment Card */}
                    {activeJob ? (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{activeJob.publicCode}</span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {activeJob.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{activeJob.jobTitle}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">{activeJob.customerAddress}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Customer:</span>
                            <span className="font-semibold text-slate-800">{activeJob.customerName}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Payout Total:</span>
                            <span className="font-bold text-emerald-700">₹{activeJob.priceBreakdown.total}</span>
                          </div>
                        </div>

                        {/* State Action Buttons according to State Machine */}
                        {activeJob.status === BookingStatus.BOOKING_CONFIRMED && (
                          <button
                            id="worker-accept-btn"
                            onClick={() =>
                              onUpdateBookingStatus(activeJob.id, BookingStatus.WORKER_ON_THE_WAY, 'Worker accepted and dispatched.')
                            }
                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow hover:bg-blue-700 transition"
                          >
                            Accept & Start Travel
                          </button>
                        )}

                        {activeJob.status === BookingStatus.WORKER_ON_THE_WAY && (
                          <button
                            id="worker-arrive-btn"
                            onClick={() =>
                              onUpdateBookingStatus(
                                activeJob.id,
                                BookingStatus.WORKER_ARRIVED,
                                'Worker arrived at premises. GPS confirmed within geofence.'
                              )
                            }
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition"
                          >
                            I Have Arrived (Geofence Check)
                          </button>
                        )}

                        {activeJob.status === BookingStatus.WORKER_ARRIVED && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-600">
                              Ask customer for their 4-digit <strong>Start OTP</strong>:
                            </p>
                            <div className="flex gap-2">
                              <input
                                id="worker-start-otp-input"
                                type="text"
                                maxLength={4}
                                placeholder="e.g. 4829"
                                value={startOtpInput}
                                onChange={(e) => setStartOtpInput(e.target.value)}
                                className="w-28 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500"
                              />
                              <button
                                id="worker-verify-start-otp-btn"
                                onClick={handleWorkerVerifyStartOtp}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded px-3 py-1.5 transition"
                              >
                                Authorize Start
                              </button>
                            </div>
                            {otpError && <p className="text-[10px] text-red-600">{otpError}</p>}
                          </div>
                        )}

                        {activeJob.status === BookingStatus.IN_PROGRESS && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded text-xs font-bold">
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>Work in progress timer active...</span>
                            </div>
                            <button
                              id="worker-request-completion-btn"
                              onClick={() =>
                                onUpdateBookingStatus(
                                  activeJob.id,
                                  BookingStatus.COMPLETION_REQUESTED,
                                  'Work finished. Customer asked to inspect work & share Completion OTP.'
                                )
                              }
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
                            >
                              Request Completion & Inspection
                            </button>
                          </div>
                        )}

                        {activeJob.status === BookingStatus.COMPLETION_REQUESTED && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-600">
                              Customer has verified work. Enter their <strong>Completion OTP</strong>:
                            </p>
                            <div className="flex gap-2">
                              <input
                                id="worker-completion-otp-input"
                                type="text"
                                maxLength={4}
                                placeholder="e.g. 7163"
                                value={completionOtpInput}
                                onChange={(e) => setCompletionOtpInput(e.target.value)}
                                className="w-28 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500"
                              />
                              <button
                                id="worker-verify-completion-otp-btn"
                                onClick={handleWorkerVerifyCompletionOtp}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded px-3 py-1.5 transition"
                              >
                                Release Escrow
                              </button>
                            </div>
                            {otpError && <p className="text-[10px] text-red-600">{otpError}</p>}
                          </div>
                        )}

                        {activeJob.status === BookingStatus.COMPLETED && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Job completed! Payout scheduled to your linked bank account.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">No active assignments right now.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="h-12 bg-white border-t border-slate-200 flex items-center justify-around text-[10px] text-slate-500 shrink-0">
              <div className="flex flex-col items-center text-blue-600 font-semibold cursor-pointer">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mb-0.5"></span>
                <span>Home</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-slate-900">
                <span>Bookings</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-slate-900">
                <span>Wallet</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-slate-900">
                <span>Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Live Booking Lifecycle Inspector & Dual-Trust OTP Bridge */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Active Booking Dual-Trust Monitor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Dual-Trust Transaction Engine</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                  {activeJob?.publicCode || 'Select Booking'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Server-authoritative state machine with cryptographic Start & Completion OTPs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Select Job:</span>
              <select
                value={activeJobId}
                onChange={(e) => setActiveJobId(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-blue-500"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.publicCode} — {b.jobTitle.slice(0, 24)}... ({b.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeJob ? (
            <div className="space-y-4">
              {/* Dual-Trust OTP Cards (Customer view) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start OTP Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      1. Start Work OTP (Customer Secret)
                    </span>
                    {activeJob.status === BookingStatus.IN_PROGRESS ||
                    activeJob.status === BookingStatus.COMPLETION_REQUESTED ||
                    activeJob.status === BookingStatus.COMPLETED ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        VERIFIED ✓
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                        PENDING ARRIVAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Customer shares this ONLY after verifying worker identity & Aadhaar badge in-person.
                  </p>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Active Start OTP:</span>
                    <span className="font-mono text-xl font-bold tracking-widest text-blue-600">
                      {activeJob.startOtp}
                    </span>
                  </div>
                </div>

                {/* Completion OTP Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      2. Completion OTP (Escrow Release)
                    </span>
                    {activeJob.status === BookingStatus.COMPLETED || activeJob.status === BookingStatus.SETTLED ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        RELEASED ✓
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        LOCKED IN ESCROW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Customer reveals this ONLY after physically inspecting the completed task and testing quality.
                  </p>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500">Completion OTP:</span>
                    <span className="font-mono text-xl font-bold tracking-widest text-emerald-700">
                      {activeJob.completionOtp}
                    </span>
                  </div>
                </div>
              </div>

              {/* State Machine Step Tracker */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  State Machine Lifecycle Transition Steps
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    BookingStatus.BOOKING_CONFIRMED,
                    BookingStatus.WORKER_ON_THE_WAY,
                    BookingStatus.WORKER_ARRIVED,
                    BookingStatus.IN_PROGRESS,
                    BookingStatus.COMPLETION_REQUESTED,
                    BookingStatus.COMPLETED,
                    BookingStatus.SETTLED,
                  ].map((step, idx) => {
                    const isCurrent = activeJob.status === step;
                    return (
                      <button
                        key={step}
                        onClick={() => onUpdateBookingStatus(activeJob.id, step, `Admin transitioned state to ${step}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}. {step.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Escrow Financial Ledger for this job */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Authoritative Price Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Visit Charge:</span>
                    <span className="font-bold text-slate-800">₹{activeJob.priceBreakdown.visitCharge}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Labor Estimate:</span>
                    <span className="font-bold text-slate-800">₹{activeJob.priceBreakdown.taskEstimate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Platform Fee (2%):</span>
                    <span className="font-bold text-slate-800">₹{activeJob.priceBreakdown.platformFee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total in Escrow:</span>
                    <span className="font-bold text-emerald-700 text-sm">₹{activeJob.priceBreakdown.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No booking chosen.</p>
          )}
        </div>

        {/* Worker Skill Passport Highlight */}
        {selectedWorker && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {selectedWorker.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedWorker.name} — Skill Passport</h3>
                  <p className="text-xs text-slate-500 font-mono">Kaam ID: {selectedWorker.kaamId} • {selectedWorker.verificationLevel}</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2.5 py-1 rounded-full">
                Aadhaar & Police Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedWorker.skills.map((skill, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-800">{skill.name}</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Confirmation Dialog */}
      {isBookingModalOpen && selectedWorker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Digital Kaam Booking</h3>
                <p className="text-xs text-slate-500">100% Escrow Protection Guaranteed</p>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-slate-900">{selectedWorker.name} ({selectedWorker.kaamId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service Category:</span>
                <span className="font-semibold text-slate-800">{selectedWorker.trade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Visit Fee:</span>
                <span className="font-semibold text-slate-800">₹{selectedWorker.pricing.visitCharge}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Estimated Labor (2 hrs):</span>
                <span className="font-semibold text-slate-800">₹{selectedWorker.pricing.hourlyRate * 2}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Digital Kaam Platform Fee + GST:</span>
                <span className="font-semibold text-slate-800">₹65</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-slate-900 bg-slate-50 px-3 rounded-lg">
                <span>Total Escrow Amount:</span>
                <span className="text-blue-600">
                  ₹{selectedWorker.pricing.visitCharge + selectedWorker.pricing.hourlyRate * 2 + 65}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Dual-Trust Guarantee:
              </p>
              <p className="text-[11px] text-blue-700">
                Funds are held in escrow. Payout is released to the worker ONLY after you verify work and share your Completion OTP.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                id="modal-confirm-pay-btn"
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Pay & Dispatch Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
