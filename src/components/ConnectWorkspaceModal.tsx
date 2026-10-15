'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { AccountSettings } from '@/types/pumble';
import { useToast } from '@/components/Toast';
import { X, Key, Shield, Zap, CheckCircle2, Building, Sparkles } from 'lucide-react';

interface ConnectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWorkspaceModal({ isOpen, onClose }: ConnectWorkspaceModalProps) {
  const [botToken, setBotToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const current = Storage.getSettings();
      setBotToken(current.botToken || '');
      setWorkspaceId(current.workspaceId === 'ws_demo_98241' ? '' : current.workspaceId || '');
      setSigningSecret(current.signingSecret || '');
      setGroqApiKey(current.groqApiKey || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !workspaceId.trim()) {
      showToast('Please enter your Bot Token (App key) and Workspace ID', 'error');
      return;
    }

    setLoading(true);
    const current = Storage.getSettings();
    const updated: AccountSettings = {
      ...current,
      botToken: botToken.trim(),
      workspaceId: workspaceId.trim(),
      signingSecret: signingSecret.trim(),
      groqApiKey: groqApiKey.trim(),
    };

    Storage.saveSettings(updated);

    // Automatically attempt to sync channels from Pumble
    try {
      const res = await fetch('/api/pumble/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: updated.botToken,
          workspaceId: updated.workspaceId,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        Storage.saveChannels(data.channels);
        showToast(`Connected & loaded ${data.channels.length} live channels from Pumble! 🚀`, 'success');
      } else {
        showToast('Workspace details saved! (Add channels manually or click Sync)', 'success');
      }
    } catch {
      showToast('Workspace details saved successfully!', 'success');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect Your Pumble Account</h2>
              <p className="text-xs text-slate-400">Paste your credentials to connect your live workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Pumble Bot Token */}
          <div>
            <label className="block font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Pumble Bot Token (App key) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. xpat-3b33aa862f5c6103a3108a6c4784df6c"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Your App key starting with <code className="text-indigo-400">xpat-...</code>
            </span>
          </div>

          {/* Workspace ID */}
          <div>
            <label className="block font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              Workspace ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 6ad0dfc8db77731b3a04070a"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Found in your browser URL: <code className="text-indigo-400">https://app.pumble.com/workspace/&lt;WORKSPACE_ID&gt;/...</code>
            </span>
          </div>

          {/* Webhook Signing Secret */}
          <div>
            <label className="block font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Signing Secret (For Webhooks)
            </label>
            <input
              type="password"
              placeholder="e.g. xpss-f8c89..."
              value={signingSecret}
              onChange={(e) => setSigningSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Groq API Key */}
          <div>
            <label className="block font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Groq AI API Key (Optional for Smart Replies)
            </label>
            <input
              type="password"
              placeholder="e.g. gsk_..."
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Free key available at <a href="https://console.groq.com/keys" target="_blank" className="text-amber-400 underline">console.groq.com</a>
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
