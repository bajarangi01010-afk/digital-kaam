import React from 'react';
import { Search, Bell, Plus, Smartphone, Shield } from 'lucide-react';
import { NavSection } from './Sidebar';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenPostKaam: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  unreadNotifications: number;
}

export const Header: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenPostKaam,
  activeSection,
  onSelectSection,
  unreadNotifications,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 w-80 md:w-96 focus-within:border-blue-500 focus-within:bg-white transition">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          id="global-search-input"
          type="text"
          placeholder="Search for skilled labor, tasks, or Kaam ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden w-full"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Simulator Switcher Shortcut */}
        <button
          onClick={() => onSelectSection(activeSection === 'FLUTTER_SIMULATOR' ? 'DASHBOARD' : 'FLUTTER_SIMULATOR')}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            activeSection === 'FLUTTER_SIMULATOR'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>{activeSection === 'FLUTTER_SIMULATOR' ? 'Back to Dashboard' : 'Open Mobile App'}</span>
        </button>

        {/* Notifications Icon */}
        <div className="relative cursor-pointer p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          )}
        </div>

        {/* Primary CTA: Post a Kaam */}
        <button
          id="header-post-kaam-btn"
          onClick={onOpenPostKaam}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Kaam</span>
        </button>
      </div>
    </header>
  );
};
