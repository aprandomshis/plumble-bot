'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Storage } from '@/lib/storage';
import { PumbleChannel } from '@/types/pumble';
import { useToast } from '@/components/Toast';
import {
  Hash,
  Lock,
  MessageSquare,
  Smile,
  UserCheck,
  Plus,
  Users,
  RotateCw,
  Sliders,
} from 'lucide-react';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'channel' | 'group' | 'dm'>('channel');
  const [editingWelcomeId, setEditingWelcomeId] = useState<string | null>(null);
  const [welcomeText, setWelcomeText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setChannels(Storage.getChannels());
    setMounted(true);
  }, []);

  const toggleSetting = (
    channelId: string,
    key: 'autoResponderEnabled' | 'autoReactEnabled' | 'welcomeMessageEnabled'
  ) => {
    const updated = channels.map((ch) =>
      ch.id === channelId ? { ...ch, [key]: !ch[key] } : ch
    );
    setChannels(updated);
    Storage.saveChannels(updated);
    showToast('Channel automation updated', 'info');
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const newChannel: PumbleChannel = {
      id: 'ch_' + Date.now(),
      name: newChannelName.trim().replace(/^#/, ''),
      type: newChannelType,
      isPrivate: newChannelType !== 'channel',
      memberCount: 5,
      autoResponderEnabled: true,
      autoReactEnabled: true,
      welcomeMessageEnabled: false,
    };

    const updated = [newChannel, ...channels];
    setChannels(updated);
    Storage.saveChannels(updated);
    setNewChannelName('');
    showToast(`Added channel #${newChannel.name}`, 'success');
  };

  const handleSyncFromPumble = async () => {
    const settings = Storage.getSettings();
    if (!settings.botToken || !settings.workspaceId || settings.workspaceId === 'ws_demo_98241') {
      showToast('Please enter your Pumble Bot Token and Workspace ID in Settings first!', 'warning');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/pumble/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.botToken,
          workspaceId: settings.workspaceId,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        setChannels(data.channels);
        Storage.saveChannels(data.channels);
        showToast(`Synced ${data.channels.length} live channels from Pumble! 🚀`, 'success');
      } else {
        showToast(data.error || 'No channels found or token lacks channels:read scope', 'error');
      }
    } catch (err: any) {
      showToast('Error syncing channels: ' + err?.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const openWelcomeEditor = (ch: PumbleChannel) => {
    setEditingWelcomeId(ch.id);
    setWelcomeText(ch.welcomeMessage || 'Welcome to #{channel}, @{user}! 🎉');
  };

  const saveWelcomeMessage = (channelId: string) => {
    const updated = channels.map((ch) =>
      ch.id === channelId
        ? { ...ch, welcomeMessage: welcomeText, welcomeMessageEnabled: true }
        : ch
    );
    setChannels(updated);
    Storage.saveChannels(updated);
    setEditingWelcomeId(null);
    showToast('Welcome message saved', 'success');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Hash className="w-6 h-6 text-sky-400" />
            Channels &amp; Groups Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure automated responses, reactions, and welcome messages across your Pumble channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncFromPumble}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Live Channels from Pumble'}</span>
          </button>

          <Link
            href="/settings"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
            title="Configure Credentials"
          >
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Add Channel Bar */}
      <form
        onSubmit={handleCreateChannel}
        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Connect Channel / Group:
        </span>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            required
            placeholder="e.g. marketing-team, announcements, vip-clients"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={newChannelType}
          onChange={(e) => setNewChannelType(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
        >
          <option value="channel">Public Channel</option>
          <option value="group">Private Group</option>
          <option value="dm">Direct Message (DM)</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Connect Channel
        </button>
      </form>

      {/* Channels List */}
      <div className="grid grid-cols-1 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="glow-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            {/* Left: Channel Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {ch.type === 'channel' ? (
                  <Hash className="w-5 h-5 text-sky-400" />
                ) : ch.type === 'group' ? (
                  <Lock className="w-5 h-5 text-amber-400" />
                ) : (
                  <Users className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="font-bold text-white text-base">#{ch.name}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {ch.type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {ch.memberCount} members
                </span>
                <span>•</span>
                <span>ID: {ch.id}</span>
              </div>
            </div>

            {/* Right: Automation Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Auto Responder Toggle */}
              <button
                onClick={() => toggleSetting(ch.id, 'autoResponderEnabled')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  ch.autoResponderEnabled
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Auto-Reply: {ch.autoResponderEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Auto React Toggle */}
              <button
                onClick={() => toggleSetting(ch.id, 'autoReactEnabled')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  ch.autoReactEnabled
                    ? 'bg-violet-950/60 border-violet-500/40 text-violet-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Auto-React: {ch.autoReactEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Welcome Message Toggle / Edit */}
              <button
                onClick={() => openWelcomeEditor(ch)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  ch.welcomeMessageEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Welcome: {ch.welcomeMessageEnabled ? 'Active' : 'Disabled'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Welcome Message Edit Dialog */}
      {editingWelcomeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Configure Welcome Message
            </h3>
            <p className="text-xs text-slate-400">
              This message will be automatically sent to the channel whenever a new member joins.
            </p>

            <textarea
              rows={4}
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Welcome @{user} to #{channel}! Feel free to introduce yourself."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingWelcomeId(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveWelcomeMessage(editingWelcomeId)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Welcome Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
