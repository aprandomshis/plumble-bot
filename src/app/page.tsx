'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Storage } from '@/lib/storage';
import {
  AutoResponderRule,
  AutoReactionRule,
  PumbleChannel,
  ActivityLog,
  AccountSettings,
import { useToast } from '@/components/Toast';
import { ConnectWorkspaceModal } from '@/components/ConnectWorkspaceModal';
import {
  MessageSquareReply,
  SmilePlus,
  Hash,
  Activity,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Copy,
  Terminal,
} from 'lucide-react';

export default function DashboardPage() {
  const [rules, setRules] = useState<AutoResponderRule[]>([]);
  const [reactions, setReactions] = useState<AutoReactionRule[]>([]);
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const reloadData = () => {
    setRules(Storage.getRules());
    setReactions(Storage.getReactions());
    setChannels(Storage.getChannels());
    setLogs(Storage.getLogs());
    setSettings(Storage.getSettings());
  };

  useEffect(() => {
    reloadData();
    setMounted(true);

    const onUpdate = () => reloadData();
    window.addEventListener('puble_settings_updated', onUpdate);
    window.addEventListener('puble_channels_updated', onUpdate);

    // Sync with server environment variables if available
    fetch('/api/settings/sync')
      .then((res) => res.json())
      .then((serverData) => {
        const curSettings = Storage.getSettings();
        if (serverData.configuredOnServer && serverData.workspaceId) {
          if (curSettings.workspaceId === 'ws_demo_98241' || !curSettings.workspaceId) {
            const updated = {
              ...curSettings,
              workspaceId: serverData.workspaceId,
              groqModel: serverData.groqModel || curSettings.groqModel,
            };
            setSettings(updated);
            Storage.saveSettings(updated);
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('puble_settings_updated', onUpdate);
      window.removeEventListener('puble_channels_updated', onUpdate);
    };
  }, []);

  const copyWebhookUrl = () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/pumble/webhook`
      : 'https://your-domain.com/api/pumble/webhook';
    navigator.clipboard.writeText(url);
    showToast('Pumble Webhook URL copied to clipboard!', 'success');
  };

  const toggleRule = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    Storage.saveRules(updated);
    showToast('Rule status updated', 'info');
  };

  const toggleReaction = (id: string) => {
    const updated = reactions.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setReactions(updated);
    Storage.saveReactions(updated);
    showToast('Reaction rule status updated', 'info');
  };

  if (!mounted || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const activeReactionsCount = reactions.filter((r) => r.enabled).length;
  const totalRepliesSent = rules.reduce((acc, r) => acc + (r.triggerCount || 0), 0);
  const totalReactionsPlaced = reactions.reduce((acc, r) => acc + (r.reactionCount || 0), 0);

  const isDemo = settings.workspaceId === 'ws_demo_98241' || !settings.botToken;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Demo Warning Banner */}
      {isDemo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-200">
                You are currently in Demo Mode (Workspace: {settings.workspaceId})
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your real Pumble workspace credentials and Groq key in Settings to automate your live team chats!
              </p>
            </div>
          </div>
          <button
            onClick={() => setConnectModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors"
          >
            Connect My Details →
          </button>
        </div>
      )}

      {/* Connect Workspace Modal */}
      <ConnectWorkspaceModal isOpen={connectModalOpen} onClose={() => setConnectModalOpen(false)} />

      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-violet-950/60 border border-indigo-500/20 p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Pumble / Puble Unified Bot Management
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Automate Chat Replies, Reactions & Groups
            </h1>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Empower your Pumble workspace with instant auto-replies, smart sentiment-driven emoji reactions, and continuous scheduled announcements across all chats and groups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/simulator"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Terminal className="w-4 h-4" />
              Test in Live Simulator
            </Link>
            <Link
              href="/responders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Responder
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glow-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Auto-Responders
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <MessageSquareReply className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{activeRulesCount}</span>
            <span className="text-xs text-slate-400">/ {rules.length} active</span>
          </div>
          <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalRepliesSent} automated replies sent</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="glow-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Auto-Reactions
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <SmilePlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{activeReactionsCount}</span>
            <span className="text-xs text-slate-400">/ {reactions.length} active</span>
          </div>
          <p className="mt-1 text-xs text-violet-400 flex items-center gap-1">
            <span>🔥 {totalReactionsPlaced} reactions placed</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="glow-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monitored Channels
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{channels.length}</span>
            <span className="text-xs text-slate-400">channels & groups</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>DMs + public & private groups</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="glow-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Engine Status
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">Operational</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Avg Response: 42ms</span>
          </p>
        </div>
      </div>

      {/* Webhook Endpoint Quick Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl text-slate-300">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Pumble Incoming Webhook Listener
            </div>
            <p className="text-xs text-slate-400">
              Paste this URL in your Pumble App settings under Event Subscriptions:
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-indigo-300 select-all">
            /api/pumble/webhook
          </code>
          <button
            onClick={copyWebhookUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy URL</span>
          </button>
        </div>
      </div>

      {/* Split Grid: Responders Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Auto-Responders */}
        <div className="glow-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <MessageSquareReply className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">Top Auto-Responders</h2>
            </div>
            <Link
              href="/responders"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              View All ({rules.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {rules.slice(0, 4).map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100 truncate">
                      {rule.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {rule.triggerType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {rule.triggers.slice(0, 3).map((tr, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-indigo-950/60 text-indigo-300 px-2 py-0.2 rounded border border-indigo-500/20"
                        >
                          {tr}
                        </span>
                      ))}
                      {rule.triggers.length > 3 && (
                        <span className="text-[11px] text-slate-400">
                          +{rule.triggers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {rule.triggerCount} hits
                  </span>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Activity Stream */}
        <div className="glow-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Recent Activity Feed</h2>
            </div>
            <Link
              href="/logs"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              All Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold ${
                        log.type === 'auto_reply'
                          ? 'text-indigo-400'
                          : log.type === 'auto_react'
                          ? 'text-violet-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {log.type === 'auto_reply'
                        ? 'Auto-Replied'
                        : log.type === 'auto_react'
                        ? 'Auto-Reacted'
                        : 'Scheduled'}
                    </span>
                    <span>in</span>
                    <span className="text-slate-300 font-medium">#{log.channelName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {log.incomingMessage && (
                  <p className="text-slate-300 italic truncate">
                    &ldquo;{log.incomingMessage}&rdquo;
                  </p>
                )}

                <div className="text-slate-400 font-mono text-[11px] truncate">
                  → {log.actionTaken}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Reactions Grid Section */}
      <div className="glow-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <SmilePlus className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="font-bold text-white text-base">Active Auto-Reaction Rules</h2>
              <p className="text-xs text-slate-400">
                Emojis automatically attached when messages contain specific keywords
              </p>
            </div>
          </div>
          <Link
            href="/reactions"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
          >
            Manage Reactions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reactions.map((react) => (
            <div
              key={react.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-200 truncate">
                    {react.name}
                  </span>
                  <button
                    onClick={() => toggleReaction(react.id)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      react.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {react.emojis.map((emoji, idx) => (
                    <span
                      key={idx}
                      className="text-lg bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>{react.reactionCount} times applied</span>
                <span>{react.delayMs}ms delay</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
