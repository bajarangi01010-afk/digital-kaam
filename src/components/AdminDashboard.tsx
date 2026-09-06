import React from 'react';
import { Booking, BookingStatus } from '../types';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Eye,
  Plus
} from 'lucide-react';

interface Props {
  bookings: Booking[];
  onOpenBookingDetail: (booking: Booking) => void;
  onOpenPostKaam: () => void;
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus, notes?: string) => void;
  onViewAllJobs: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  bookings,
  onOpenBookingDetail,
  onOpenPostKaam,
  onUpdateBookingStatus,
  onViewAllJobs,
}) => {
  // Helper for status badge styling
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.DRAFT:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">DRAFT</span>;
      case BookingStatus.PAYMENT_PENDING:
      case BookingStatus.BOOKING_CONFIRMED:
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">PENDING</span>;
      case BookingStatus.WORKER_ON_THE_WAY:
      case BookingStatus.WORKER_ARRIVED:
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">IN REVIEW</span>;
      case BookingStatus.IN_PROGRESS:
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px] font-bold">ACCEPTED</span>;
      case BookingStatus.COMPLETED:
      case BookingStatus.SETTLED:
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">SETTLED</span>;
      case BookingStatus.REFUNDED:
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-bold">REFUNDED</span>;
      case BookingStatus.DISPUTED:
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-bold">DISPUTED</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Monthly Earnings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Earnings</p>
          <h3 className="text-2xl font-bold text-slate-900">₹42,850.00</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +12% from last month
          </p>
        </div>

        {/* Card 2: Active Projects */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Projects</p>
          <h3 className="text-2xl font-bold text-slate-900">08</h3>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Next due in 2 hours
          </p>
        </div>

        {/* Card 3: Success Rate */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Success Rate</p>
          <h3 className="text-2xl font-bold text-slate-900">98.4%</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Excellent standing
          </p>
        </div>

        {/* Card 4: New Leads */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Leads</p>
          <h3 className="text-2xl font-bold text-slate-900">24</h3>
          <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            5 Urgent requests
          </p>
        </div>
      </div>

      {/* Main Grid: 2 Columns (Job Postings + Lead Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Job Postings (col-span-2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Job Postings</h2>
              <p className="text-xs text-slate-500">Live Escrow & Dual-Trust transactions across Delhi NCR</p>
            </div>
            <button
              id="view-all-jobs-btn"
              onClick={onViewAllJobs}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold transition flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-bold">Job Title</th>
                  <th className="px-6 py-3.5 font-bold">Category</th>
                  <th className="px-6 py-3.5 font-bold">Budget</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {bookings.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{job.jobTitle}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {job.publicCode} • {job.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{job.serviceCategory}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{job.priceBreakdown.total.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onOpenBookingDetail(job)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-blue-600 font-semibold bg-slate-100 hover:bg-blue-50 rounded border border-slate-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {bookings.length} active platform gigs</span>
            <button
              onClick={onOpenPostKaam}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Post New Kaam Request
            </button>
          </div>
        </div>

        {/* Right Column: Lead Distribution (col-span-1) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Lead Distribution</h2>

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Visual Circular Donut Chart */}
            <div className="w-44 h-44 rounded-full border-[14px] border-slate-100 flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 rounded-full border-[14px] border-blue-600 border-t-transparent border-r-transparent rotate-45 transition-transform duration-700"></div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-900">68%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Conversion</p>
              </div>
            </div>

            {/* Distribution Legend */}
            <div className="w-full space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Skilled Labor (Electrical & Plumbing)</span>
                </div>
                <span className="font-bold text-slate-900">42%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Logistics & Heavy Carpentry</span>
                </div>
                <span className="font-bold text-slate-900">26%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Others (Appliance Repair & HVAC)</span>
                </div>
                <span className="font-bold text-slate-900">32%</span>
              </div>
            </div>

            {/* Trust Assurance Badge */}
            <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>All leads matched with Level 2+ verified Aadhaar & Skill Passport technicians.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
