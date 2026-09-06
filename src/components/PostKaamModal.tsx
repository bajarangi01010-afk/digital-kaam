import React, { useState } from 'react';
import { Booking, BookingStatus, WorkerProfile } from '../types';
import { X, ShieldCheck, MapPin, IndianRupee, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerProfile[];
  onSubmit: (newBooking: Partial<Booking>) => void;
}

export const PostKaamModal: React.FC<Props> = ({ isOpen, onClose, workers, onSubmit }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(850);
  const [address, setAddress] = useState('Flat 402, Green Valley Heights, Sector 48, Gurugram');
  const [customerName, setCustomerName] = useState('Rajat Verma');
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
    const code = `DK-BKG-${Math.floor(1000 + Math.random() * 9000)}`;
    const startOtp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const completionOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const visit = chosenWorker.pricing.visitCharge;
    const task = Math.max(200, budget - visit - 50);
    const platformFee = Math.round(budget * 0.02);
    const gst = Math.round(platformFee * 0.18);
    const total = visit + task + platformFee + gst;

    const newBooking: Partial<Booking> = {
      id: `bkg-${Date.now()}`,
      publicCode: code,
      customerName,
      customerPhone: '+91 98100 23411',
      customerAddress: address,
      workerId: chosenWorker.id,
      workerName: chosenWorker.name,
      workerKaamId: chosenWorker.kaamId,
      serviceCategory: category,
      jobTitle: jobTitle || `${category} Diagnostics & Repair`,
      description: description || 'Routine inspection and troubleshooting with genuine parts.',
      scheduledTime: 'Today, within 1 hour',
      status: BookingStatus.PAYMENT_CONFIRMED,
      priceBreakdown: {
        visitCharge: visit,
        taskEstimate: task,
        platformFee,
        gstTax: gst,
        total,
      },
      paymentMethod: 'UPI / Escrow',
      paymentId: `pay_rzp_${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentConfirmedAt: 'Just now',
      startOtp,
      completionOtp,
      notes: 'Job posted with 100% Escrow Protection. Assigned to verified specialist.',
    };

    onSubmit(newBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Post a Kaam (Service Request)</h3>
            <p className="text-xs text-slate-500">Lock budget with Dual-Trust Escrow protection</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Inverter AC PCB Short Circuit Repair"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Air Cooling">Air Cooling / HVAC</option>
                <option value="Appliance Repair">Appliance Repair</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimated Budget (₹)</label>
              <input
                type="number"
                min={300}
                max={50000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Preferred Verified Worker</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.kaamId}) — {w.trade} [Rating {w.rating}★]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Service Address (Delhi NCR)</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Problem Description</label>
            <textarea
              rows={2}
              placeholder="Describe symptoms, noise, leaks, or required spare parts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-slate-600">
              Payment is held securely in <strong>Digital Kaam Escrow</strong>. The worker will only receive payment after you share your <strong>Completion OTP</strong>.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Lock Escrow & Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
