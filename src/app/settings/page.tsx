'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { AccountSettings } from '@/types/pumble';
import { GROQ_MODELS } from '@/lib/groq';
import { useToast } from '@/components/Toast';
import {
  Sliders,
  Key,
  Shield,
  Clock,
  Save,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  ExternalLink,
  Bot,
  Zap,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    text?: string;
    latency?: number;
    model?: string;
    error?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setSettings(Storage.getSettings());
    setMounted(true);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    Storage.saveSettings(settings);
    showToast('Settings saved successfully', 'success');
  };

  const handleTestConnection = async () => {
    if (!settings) return;
    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const res = await fetch('/api/pumble/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.botToken,
          workspaceId: settings.workspaceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionResult('Connected! Workspace authenticated successfully.');
        showToast('Connection verified successfully! ⚡', 'success');
      } else {
        setConnectionResult(`Error: ${data.error || 'Connection failed'}`);
        showToast(data.error || 'Authentication failed', 'error');
      }
    } catch (err: any) {
      setConnectionResult('Network error verifying connection.');
      showToast('Network error verifying connection', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestGroq = async () => {
    if (!settings) return;
    setTestingGroq(true);
    setGroqTestResult(null);

    try {
      const res = await fetch('/api/groq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomingMessage: 'Hello! Please summarize your capabilities in 1 concise sentence.',
          senderName: 'Admin',
          channelName: 'general',
          systemPrompt: settings.groqSystemPrompt,
          apiKey: settings.groqApiKey,
          model: settings.groqModel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGroqTestResult({
          text: data.content,
          latency: data.latencyMs,
          model: data.model,
        });
        showToast(`Groq AI Test Succeeded in ${data.latencyMs}ms! ⚡`, 'success');
      } else {
        setGroqTestResult({ error: data.error || 'Groq API request failed' });
        showToast('Groq AI test failed', 'error');
      }
    } catch (err: any) {
      setGroqTestResult({ error: err?.message || 'Network error' });
      showToast('Error calling Groq API', 'error');
    } finally {
      setTestingGroq(false);
    }
  };

  const handleExportFullConfig = () => {
    const fullBackup = {
      rules: Storage.getRules(),
      reactions: Storage.getReactions(),
      channels: Storage.getChannels(),
      scheduled: Storage.getScheduled(),
      settings: Storage.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `puble_full_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Full workspace configuration backup downloaded', 'success');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.rules) Storage.saveRules(parsed.rules);
        if (parsed.reactions) Storage.saveReactions(parsed.reactions);
        if (parsed.channels) Storage.saveChannels(parsed.channels);
        if (parsed.scheduled) Storage.saveScheduled(parsed.scheduled);
        if (parsed.settings) {
          Storage.saveSettings(parsed.settings);
          setSettings(parsed.settings);
        }
        showToast('Configuration restored successfully! Refreshing...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showToast('Invalid backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all rules, reactions, channels and settings to initial defaults?')) {
      Storage.resetToDefaults();
      showToast('Reset to demo defaults', 'info');
      setTimeout(() => window.location.reload(), 500);
    }
  };

  if (!mounted || !settings) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Bot & API Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure Pumble credentials, Groq AI API keys, Llama 3 models, and operating schedules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Groq AI Configuration Card */}
        <div className="glow-card rounded-2xl p-6 space-y-4 border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Groq AI API (Ultra-Fast LLM Inference)
                </h2>
                <p className="text-xs text-slate-400">
                  Power intelligent auto-responders & sentiment reactions with Llama 3.3
                </p>
              </div>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              Get Free Groq API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-4 text-sm">
            {/* Groq API Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Groq API Key
              </label>
              <input
                type="password"
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.groqApiKey}
                onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Leave blank to use built-in simulator mode. Get free keys at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  className="text-amber-400 underline"
                >
                  console.groq.com
                </a>
              </span>
            </div>

            {/* Groq Model Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  LLM Model
                </label>
                <select
                  value={settings.groqModel}
                  onChange={(e) => setSettings({ ...settings, groqModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                >
                  {GROQ_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.enableAiResponses}
                    onChange={(e) =>
                      setSettings({ ...settings, enableAiResponses: e.target.checked })
                    }
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-medium">Enable Groq AI Auto-Replies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.enableAiReactions}
                    onChange={(e) =>
                      setSettings({ ...settings, enableAiReactions: e.target.checked })
                    }
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-medium">Enable Groq AI Sentiment Reactions</span>
                </label>
              </div>
            </div>

            {/* Global System Persona Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Global Bot Persona / System Prompt
              </label>
              <textarea
                rows={3}
                value={settings.groqSystemPrompt}
                onChange={(e) => setSettings({ ...settings, groqSystemPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed"
                placeholder="You are PubleBot, an intelligent and friendly assistant for the team chat..."
              />
            </div>

            {/* Test Groq AI Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleTestGroq}
                disabled={testingGroq}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors flex items-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5" />
                {testingGroq ? 'Running Groq Inference...' : 'Test Groq AI Speed & Output'}
              </button>

              {groqTestResult?.latency && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Latency: {groqTestResult.latency}ms ({groqTestResult.model})
                </span>
              )}
              {groqTestResult?.error && (
                <span className="text-xs text-rose-400">{groqTestResult.error}</span>
              )}
            </div>

            {groqTestResult?.text && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-xs text-slate-200">
                <span className="text-[10px] text-amber-400 font-mono block mb-1">
                  Generated Output ({groqTestResult.latency}ms):
                </span>
                &ldquo;{groqTestResult.text}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Pumble API Credentials */}
        <div className="glow-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Pumble Workspace Credentials
            </h2>
            <a
              href="https://pumble.com/help/apps-and-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Pumble Developer Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Pumble Bot API Token
              </label>
              <input
                type="password"
                placeholder="pumble_bot_token_xxxxxxx (Optional in simulator mode)"
                value={settings.botToken}
                onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Found in your Pumble Workspace Settings &gt; Apps &amp; Integrations.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Workspace ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ws_demo_98241"
                  value={settings.workspaceId}
                  onChange={(e) => setSettings({ ...settings, workspaceId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Webhook Signing Secret
                </label>
                <input
                  type="password"
                  placeholder="sec_sample_secret"
                  value={settings.signingSecret}
                  onChange={(e) => setSettings({ ...settings, signingSecret: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-colors flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                {testingConnection ? 'Testing Connection...' : 'Test Pumble Connection'}
              </button>

              {connectionResult && (
                <span
                  className={`text-xs font-medium ${
                    connectionResult.includes('Connected') ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {connectionResult}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bot Profile & Behavior */}
        <div className="glow-card rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-400" />
              Bot Identity &amp; Behavior
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Bot Display Name
              </label>
              <input
                type="text"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Human Typing Delay
                </label>
                <span className="text-xs font-mono text-violet-400">
                  {settings.humanTypingDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={4000}
                step={100}
                value={settings.humanTypingDelayMs}
                onChange={(e) =>
                  setSettings({ ...settings, humanTypingDelayMs: Number(e.target.value) })
                }
                className="w-full accent-violet-500 cursor-pointer mt-2"
              />
              <span className="text-[11px] text-slate-500">
                Pauses with a typing indicator before posting automated responses
              </span>
            </div>
          </div>
        </div>

        {/* Operating Hours / Schedule */}
        <div className="glow-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Operating Hours &amp; Schedule
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableWorkingHours}
                onChange={(e) =>
                  setSettings({ ...settings, enableWorkingHours: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-300">Restrict to Working Hours</span>
            </label>
          </div>

          {settings.enableWorkingHours ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.workingHoursStart}
                  onChange={(e) =>
                    setSettings({ ...settings, workingHoursStart: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.workingHoursEnd}
                  onChange={(e) =>
                    setSettings({ ...settings, workingHoursEnd: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Bot automations are currently configured to respond 24/7 without time restrictions.
            </p>
          )}
        </div>

        {/* Save Settings Button */}
        <div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>

      {/* Backup & Restore Section */}
      <div className="glow-card rounded-2xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Backup, Restore &amp; Reset
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely backup all your auto-responder rules, reactions, channels, and Groq configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportFullConfig}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Workspace JSON Backup
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Restore from JSON Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Demo Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
