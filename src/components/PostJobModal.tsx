import React, { useState, useRef } from 'react';
import { translations, Language } from '../utils/i18n';
import { sound } from '../utils/audio';
import { PostedJob } from '../types';
import {
  X,
  Upload,
  Camera,
  Mic,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  Zap,
  Wrench,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  onAddPostedJob: (job: PostedJob) => void;
}

export const PostJobModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lang,
  customerName,
  customerPhone,
  customerAddress,
  onAddPostedJob,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('इलेक्ट्रीशियन (Electrician)');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState<number>(600);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    sound.playClick();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
        sound.playSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleVoice = () => {
    sound.playClick();
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setVoiceNoteRecorded(true);
        sound.playSuccess();
      }, 2500);
    } else {
      setIsRecordingVoice(false);
      setVoiceNoteRecorded(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCash();

    const newJob: PostedJob = {
      id: `job-${Date.now()}`,
      title: title.trim() || 'घर का सामान्य रिपेयर कार्य',
      category: category,
      description: description.trim() || 'त्वरित कारीगर की आवश्यकता है।',
      imageUrl:
        imagePreview ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      voiceNoteUrl: voiceNoteRecorded ? 'simulated_audio_note.wav' : undefined,
      budget: Number(budget) || 500,
      customerName: customerName,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      customerTrustScore: 98,
      distanceKm: 0.9,
      postedAt: 'अभी-अभी (Just now)',
      status: 'OPEN',
      interestedWorkers: [],
    };

    onAddPostedJob(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {lang === 'hi' ? 'नया काम पोस्ट करें' : 'Post a New Kaam'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'फोटो या बोलकर बताएं, आस-पास के सत्यापित कारीगर तुरंत संपर्क करेंगे।'
                : 'Explain with photos or text; verified local workers nearby will get alerted.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">काम का शीर्षक (Title) *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="उदा. मेन बोर्ड में शॉर्ट सर्किट रिपेयर या नल की लीकेज"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-hidden"
            />
          </div>

          {/* Trade Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">काम की श्रेणी (Category) *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-hidden"
            >
              <option value="इलेक्ट्रीशियन (Electrician)">इलेक्ट्रीशियन (Electrician)</option>
              <option value="प्लंबर (Plumber)">प्लंबर (Plumber)</option>
              <option value="बढ़ई (Carpenter)">बढ़ई (Carpenter)</option>
              <option value="पेंटर (Painter)">पेंटर (Painter)</option>
              <option value="एसी & फ्रिज रिपेयर">एसी & फ्रिज रिपेयर (AC & Refrigerator)</option>
              <option value="राजमिस्त्री (Mason)">राजमिस्त्री (Mason)</option>
              <option value="सफाई (House Cleaning)">सफाई (House Cleaning)</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">काम का विवरण (Description):</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="काम के बारे में बताएं, क्या समस्या आ रही है..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
            />
          </div>

          {/* Explain with Photo or Simulated Voice Note */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
              <span>फोटो या बोलकर समझाएं (Photo & Voice Note)</span>
              <span className="text-[10px] text-indigo-600 font-semibold">कारीगर को काम समझना आसान होगा</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {/* Photo Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                {imagePreview ? 'फोटो बदली गई ✓' : 'काम की फोटो जोड़ें'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Voice Note Simulation */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition ${
                  isRecordingVoice
                    ? 'bg-rose-600 text-white animate-pulse'
                    : voiceNoteRecorded
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                }`}
              >
                <Mic className={`w-4 h-4 ${isRecordingVoice ? 'animate-bounce' : 'text-rose-500'}`} />
                {isRecordingVoice
                  ? 'रिकॉर्डिंग हो रही है... बोलें'
                  : voiceNoteRecorded
                  ? 'आवाज़ रिकॉर्ड हुई ✓ (2.4s)'
                  : 'बोलकर बताएं (Voice)'}
              </button>
            </div>

            {imagePreview && (
              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-300 mt-2">
                <img src={imagePreview} alt="Work Photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Budget & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">अनुमानित बजट / मजदूरी (₹) *</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">काम का स्थान (Location)</label>
              <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-700 flex items-start gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="truncate">{customerAddress}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              रद्द करें
            </button>

            <button
              id="submit-post-kaam-btn"
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              काम तुरंत पोस्ट करें
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
