'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareReply,
  SmilePlus,
  Hash,
  CalendarClock,
  TerminalSquare,
  ScrollText,
  Sliders,
  Bot,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/responders', label: 'Auto-Responders', icon: MessageSquareReply },
  { href: '/reactions', label: 'Auto-Reactions', icon: SmilePlus },
  { href: '/channels', label: 'Channels & Groups', icon: Hash },
  { href: '/scheduled', label: 'Scheduled Messages', icon: CalendarClock },
  { href: '/simulator', label: 'Live Simulator', icon: TerminalSquare },
  { href: '/logs', label: 'Activity Logs', icon: ScrollText },
  { href: '/settings', label: 'Bot & API Settings', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen glass-nav flex flex-col shrink-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
              Puble Hub
              <span className="text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Pumble Automation Suite</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-3 mb-2">
          Automations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.href === '/simulator' && (
                <span className="ml-auto flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-900/60 border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 badge-pulse" />
            <span className="text-xs font-semibold text-slate-200">Engine Active</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            v1.4.2
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Pumble webhooks & auto-rules running smoothly.
        </p>
      </div>
    </aside>
  );
}
