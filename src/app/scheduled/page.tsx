'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { ScheduledMessage, PumbleChannel, ScheduleFrequency } from '@/types/pumble';
import { useToast } from '@/components/Toast';
import {
  CalendarClock,
  Plus,
  Send,
  Trash2,
  Clock,
  Hash,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function ScheduledPage() {
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channelId, setChannelId] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleFrequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');

  useEffect(() => {
    setScheduled(Storage.getScheduled());
    const chs = Storage.getChannels();
    setChannels(chs);
    if (chs.length > 0) setChannelId(chs[0].id);
    setMounted(true);
  }, []);

  const handleToggle = (id: string) => {
    const updated = scheduled.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setScheduled(updated);
    Storage.saveScheduled(updated);
  };

  const handleDelete = (id: string) => {
    const updated = scheduled.filter((s) => s.id !== id);
    setScheduled(updated);
    Storage.saveScheduled(updated);
    showToast('Scheduled message removed', 'info');
  };

  const handleSendNow = (item: ScheduledMessage) => {
    Storage.addLog({
      type: 'scheduled_send',
      channelId: item.channelId,
      channelName: item.channelName,
      senderName: 'PubleBot (Scheduler)',
      actionTaken: `Dispatched scheduled announcement: "${item.title}"`,
      status: 'success',
      details: item.content,
    });
    showToast(`Broadcasted "${item.title}" to #${item.channelName}! 🚀`, 'success');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const targetCh = channels.find((c) => c.id === channelId) || channels[0];

    const newItem: ScheduledMessage = {
      id: 'sched_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      channelId: targetCh.id,
      channelName: targetCh.name,
      scheduleType,
      timeOfDay,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
      enabled: true,
    };

    const updated = [newItem, ...scheduled];
    setScheduled(updated);
    Storage.saveScheduled(updated);
    setModalOpen(false);
    setTitle('');
    setContent('');
    showToast(`Created scheduled broadcast "${newItem.title}"`, 'success');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-indigo-400" />
            Scheduled Messages & Announcements
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Broadcast automated recurring standups, weekly updates, and reminders to Pumble channels.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule New Message
        </button>
      </div>

      {/* Grid of Scheduled Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduled.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <CalendarClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Scheduled Messages</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add automated recurring updates or reminders for your team.
            </p>
          </div>
        ) : (
          scheduled.map((item) => (
            <div
              key={item.id}
              className={`glow-card rounded-2xl p-5 flex flex-col justify-between transition-all ${
                !item.enabled ? 'opacity-60 bg-slate-950/40' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 text-sky-400">
                        <Hash className="w-3.5 h-3.5" />
                        #{item.channelName}
                      </span>
                      <span>•</span>
                      <span className="uppercase font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">
                        {item.scheduleType}
                      </span>
                      {item.timeOfDay && <span>at {item.timeOfDay}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      item.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.enabled ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                  {item.content}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next Run: {new Date(item.nextRunAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleSendNow(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Send Now
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition-colors"
                  title="Delete scheduled message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Schedule New Pumble Announcement</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Standup Reminder"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Channel
                </label>
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      #{ch.name} ({ch.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value as ScheduleFrequency)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="once">Send Once</option>
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Mon - Fri (Weekdays)</option>
                    <option value="interval">Every Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Time of Day
                  </label>
                  <input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Announcement Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Good morning team! Please drop your updates for today..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
