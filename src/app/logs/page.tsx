'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { ActivityLog, LogType } from '@/types/pumble';
import { useToast } from '@/components/Toast';
import {
  ScrollText,
  Search,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquareReply,
  SmilePlus,
  CalendarClock,
  Filter,
} from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setLogs(Storage.getLogs());
    setMounted(true);
  }, []);

  const handleClear = () => {
    if (confirm('Clear all activity logs?')) {
      Storage.saveLogs([]);
      setLogs([]);
      showToast('Logs cleared', 'info');
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `puble_activity_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Logs exported as JSON', 'success');
  };

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase();
    const matchesSearch =
      log.channelName.toLowerCase().includes(term) ||
      log.senderName.toLowerCase().includes(term) ||
      (log.incomingMessage && log.incomingMessage.toLowerCase().includes(term)) ||
      log.actionTaken.toLowerCase().includes(term) ||
      (log.ruleName && log.ruleName.toLowerCase().includes(term));

    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-indigo-400" />
            Activity & Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time audit log of all incoming messages, automated replies, and emoji reactions processed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, channel, trigger keyword, or rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Events</option>
            <option value="auto_reply">Auto-Replies Only</option>
            <option value="auto_react">Auto-Reactions Only</option>
            <option value="scheduled_send">Scheduled Dispatches</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="glow-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Incoming Message</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-semibold text-[10px] uppercase ${
                          log.type === 'auto_reply'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                            : log.type === 'auto_react'
                            ? 'bg-violet-950 text-violet-300 border border-violet-500/30'
                            : 'bg-sky-950 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {log.type === 'auto_reply' && <MessageSquareReply className="w-3 h-3" />}
                        {log.type === 'auto_react' && <SmilePlus className="w-3 h-3" />}
                        {log.type === 'scheduled_send' && <CalendarClock className="w-3 h-3" />}
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                      #{log.channelName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {log.senderName}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400 italic">
                      {log.incomingMessage ? `"${log.incomingMessage}"` : '—'}
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-200 font-medium">
                      {log.actionTaken}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Success
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      {log.status === 'ignored' && (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ignored
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
