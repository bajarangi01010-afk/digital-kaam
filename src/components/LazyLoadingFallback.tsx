import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface LazyLoadingFallbackProps {
  message?: string;
  isModal?: boolean;
}

export const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({
  message = 'मॉड्यूल लोड हो रहा है...',
  isModal = false,
}) => {
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 text-center animate-fade-in max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-200">{message}</p>
          <span className="text-xs text-slate-400">कृपया प्रतीक्षा करें...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[380px] w-full flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Zap className="w-7 h-7 text-indigo-400 animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
      </div>
      <h3 className="text-base font-bold text-slate-200">{message}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        Digital Kaam Modular Architecture — Loading on-demand bundle
      </p>
    </div>
  );
};
