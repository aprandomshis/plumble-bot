'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { AccountSettings } from '@/types/pumble';
import { useToast } from '@/components/Toast';
import { Power, Bot, Zap, MessageSquare, Smile } from 'lucide-react';

export function Header() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setSettings(Storage.getSettings());
  }, []);

  const toggleMaster = () => {
    if (!settings) return;
    const updated = { ...settings, isMasterBotActive: !settings.isMasterBotActive };
    setSettings(updated);
    Storage.saveSettings(updated);
    showToast(
      updated.isMasterBotActive
        ? 'Puble Bot engine activated ⚡'
        : 'Puble Bot paused across all channels',
      updated.isMasterBotActive ? 'success' : 'warning'
    );
  };

  const toggleAutoResponder = () => {
    if (!settings) return;
    const updated = { ...settings, isAutoResponderActive: !settings.isAutoResponderActive };
    setSettings(updated);
    Storage.saveSettings(updated);
    showToast(
      `Auto-Responder ${updated.isAutoResponderActive ? 'Enabled' : 'Disabled'}`,
      'info'
    );
  };

  const toggleAutoReact = () => {
    if (!settings) return;
    const updated = { ...settings, isAutoReactActive: !settings.isAutoReactActive };
    setSettings(updated);
    Storage.saveSettings(updated);
    showToast(`Auto-React ${updated.isAutoReactActive ? 'Enabled' : 'Disabled'}`, 'info');
  };

  if (!settings) {
    return (
      <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-8 flex items-center justify-between text-slate-400">
        <span className="text-sm">Loading bot controls...</span>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 md:px-8 flex items-center justify-between z-20">
      {/* Left: Bot Status Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              settings.isMasterBotActive
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 badge-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold text-slate-100 text-sm">{settings.botName}</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono border border-slate-700">
            {settings.workspaceId}
          </span>
        </div>
      </div>

      {/* Right: Master Automation Quick Switches */}
      <div className="flex items-center gap-3">
        {/* Auto-Responder Toggle */}
        <button
          onClick={toggleAutoResponder}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            settings.isAutoResponderActive
              ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Auto-Responders globally"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Auto-Reply:</span>
          <span className="font-bold">{settings.isAutoResponderActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Auto-React Toggle */}
        <button
          onClick={toggleAutoReact}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            settings.isAutoReactActive
              ? 'bg-violet-950/60 border-violet-500/40 text-violet-300 hover:bg-violet-900/60'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
          }`}
          title="Toggle Auto-Reactions globally"
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Auto-React:</span>
          <span className="font-bold">{settings.isAutoReactActive ? 'ON' : 'OFF'}</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Master Power Button */}
        <button
          onClick={toggleMaster}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 ${
            settings.isMasterBotActive
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
              : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{settings.isMasterBotActive ? 'Pause Bot' : 'Start Bot'}</span>
        </button>
      </div>
    </header>
  );
}
