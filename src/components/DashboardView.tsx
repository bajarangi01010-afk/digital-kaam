import React from 'react';
import { Booking, BookingStatus } from '../types';
import { ShieldCheck, ArrowUpRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onViewAllGigs: () => void;
  onPostKaamClick: () => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  onSelectBooking,
  onViewAllGigs,
  onPostKaamClick,
  searchQuery
}) => {
  // Filter bookings if search query is typed
  const filteredBookings = bookings.filter(b => 
    b.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.publicCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.WORKER_ARRIVED:
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">WAITING START OTP</span>;
      case BookingStatus.IN_PROGRESS:
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">IN PROGRESS</span>;
      case BookingStatus.SETTLED:
      case BookingStatus.COMPLETED:
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">ACCEPTED / SETTLED</span>;
      case BookingStatus.BOOKING_CONFIRMED:
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">ESCROW HELD</span>;
      case BookingStatus.NO_SHOW_REVIEW:
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">NO-SHOW REVIEW</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Dual-Trust Guarantee */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-blue-600/30 border border-blue-500/40 rounded-lg flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Digital Kaam Dual-Trust Architecture</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Zero client authority on payments or completion. Authoritative Server Escrow + Verified Arrival + 2-Stage OTP Authorization.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPostKaamClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Create New Booking
          </button>
        </div>
      </div>

      {/* Top Metric Cards matching theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Escrow Volume</p>
          <h3 className="text-2xl font-bold text-slate-900">₹42,850.00</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <span>↑ +12% from last month</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Projects</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {String(bookings.filter(b => b.status !== BookingStatus.SETTLED && b.status !== BookingStatus.CANCELLED).length).padStart(2, '0')}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Next arrival check in 14m</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dual-Trust Success Rate</p>
          <h3 className="text-2xl font-bold text-slate-900">98.4%</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Verified by OTP & Geo-Fence</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verified Kaam Leads</p>
          <h3 className="text-2xl font-bold text-slate-900">24</h3>
          <p className="text-xs text-blue-600 mt-2 font-medium">5 Immediate requests nearby</p>
        </div>
      </div>

      {/* Main Content Grid: Recent Job Postings & Lead Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table column */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Job Postings & Work Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click on any job to test the live Dual-Trust OTP verification</p>
            </div>
            <button
              onClick={onViewAllGigs}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Gigs</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                  <th className="px-6 py-4 font-bold">Job Title & Code</th>
                  <th className="px-6 py-4 font-bold">Category & Partner</th>
                  <th className="px-6 py-4 font-bold">Escrow Budget</th>
                  <th className="px-6 py-4 font-bold">Trust Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredBookings.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectBooking(job)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{job.jobTitle}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{job.publicCode} • {job.customerName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium text-slate-800">{job.serviceCategory}</div>
                      <div className="text-xs text-blue-600 font-semibold">{job.workerName} ({job.workerKaamId})</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">₹{job.priceBreakdown.total.toLocaleString('en-IN')}</span>
                      <span className="block text-[10px] text-emerald-600 font-medium">100% Escrow Held</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Distribution column matching theme */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Lead Distribution</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Bengaluru</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            {/* Donut graphic matching the theme */}
            <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-full border-[12px] border-blue-600 border-t-transparent border-r-transparent rotate-45 transition-transform"
                style={{ transform: 'rotate(50deg)' }}
              ></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">68%</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Conversion</p>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="w-full space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Skilled Trade (Electrical/Plumbing)</span>
                </div>
                <span className="font-bold text-slate-900">42%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Cooling & Heavy Appliances</span>
                </div>
                <span className="font-bold text-slate-900">26%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                  <span className="text-slate-600 font-medium">Carpentry, Masonry & Others</span>
                </div>
                <span className="font-bold text-slate-900">32%</span>
              </div>
            </div>

            {/* Dual Trust Note */}
            <div className="w-full p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900">
              <p className="font-semibold mb-0.5">🔒 No-Show Auto-Protection</p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                If a confirmed worker does not arrive after 15 min grace window, 100% full refund is issued automatically to original payment method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
