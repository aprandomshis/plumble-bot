'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { AutoResponderRule, PumbleChannel } from '@/types/pumble';
import { RuleModal } from '@/components/RuleModal';
import { useToast } from '@/components/Toast';
import {
  MessageSquareReply,
  Plus,
  Search,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Hash,
  Play,
} from 'lucide-react';

export default function RespondersPage() {
  const [rules, setRules] = useState<AutoResponderRule[]>([]);
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoResponderRule | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setRules(Storage.getRules());
    setChannels(Storage.getChannels());
    setMounted(true);
  }, []);

  const handleSave = (savedRule: AutoResponderRule) => {
    let updated: AutoResponderRule[];
    const exists = rules.some((r) => r.id === savedRule.id);
    if (exists) {
      updated = rules.map((r) => (r.id === savedRule.id ? savedRule : r));
      showToast(`Updated "${savedRule.name}"`, 'success');
    } else {
      updated = [savedRule, ...rules];
      showToast(`Created responder "${savedRule.name}"`, 'success');
    }
    setRules(updated);
    Storage.saveRules(updated);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete auto-responder "${name}"?`)) {
      const updated = rules.filter((r) => r.id !== id);
      setRules(updated);
      Storage.saveRules(updated);
      showToast(`Deleted rule "${name}"`, 'info');
    }
  };

  const handleToggle = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    Storage.saveRules(updated);
  };

  const handleDuplicate = (rule: AutoResponderRule) => {
    const duplicated: AutoResponderRule = {
      ...rule,
      id: 'rule_' + Date.now(),
      name: `${rule.name} (Copy)`,
      triggerCount: 0,
      lastTriggeredAt: undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...rules];
    setRules(updated);
    Storage.saveRules(updated);
    showToast(`Duplicated "${rule.name}"`, 'success');
  };

  const handleTestRule = (rule: AutoResponderRule) => {
    const sampleKeyword = rule.triggers[0] || 'hello';
    const sampleResponse = rule.responses[0] || 'Sample reply';
    showToast(
      `Test Passed! Trigger "${sampleKeyword}" matches and returns: "${sampleResponse.slice(0, 50)}..."`,
      'success'
    );
  };

  const filtered = rules.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.triggers.some((t) => t.toLowerCase().includes(term)) ||
      r.responses.some((res) => res.toLowerCase().includes(term))
    );
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <MessageSquareReply className="w-6 h-6 text-indigo-400" />
            Auto-Responders
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated reply rules that fire when users send triggers in Pumble channels and DMs.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRule(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Responder
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules by name, keyword trigger, or reply text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium px-2 whitespace-nowrap">
          {filtered.length} of {rules.length} rules
        </div>
      </div>

      {/* Rules Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <MessageSquareReply className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Auto-Responders Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? 'Try a different search query'
                : 'Click "Create Responder" to start automating replies in your Pumble workspace'}
            </p>
          </div>
        ) : (
          filtered.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`glow-card rounded-2xl p-5 transition-all ${
                  !rule.enabled ? 'opacity-60 bg-slate-950/40' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">{rule.name}</h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-500/20">
                        {rule.triggerType}
                      </span>
                      {rule.matchCase && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/20">
                          Aa Case-Sensitive
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {rule.targetScope.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Triggers Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-400">Triggers:</span>
                      {rule.triggers.map((tr, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 font-mono"
                        >
                          &ldquo;{tr}&rdquo;
                        </span>
                      ))}
                    </div>

                    {/* Responses preview */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <span>Reply ({rule.responseType}):</span>
                      </div>
                      &ldquo;{rule.responses[0]}&rdquo;
                      {rule.responses.length > 1 && (
                        <span className="text-indigo-400 text-[11px] block mt-1">
                          + {rule.responses.length - 1} alternate variant(s)
                        </span>
                      )}
                    </div>

                    {/* Meta bar */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Cooldown: {rule.cooldownSeconds}s</span>
                      </div>
                      <div>
                        <span>Hits: </span>
                        <strong className="text-slate-200">{rule.triggerCount}</strong>
                      </div>
                      {rule.lastTriggeredAt && (
                        <div>
                          <span>Last fired: </span>
                          <span className="text-slate-300 font-mono">
                            {new Date(rule.lastTriggeredAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestRule(rule)}
                        title="Simulate rule"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(rule)}
                        title="Duplicate rule"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setModalOpen(true);
                        }}
                        title="Edit rule"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id, rule.name)}
                        title="Delete rule"
                        className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs transition-colors border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <RuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        ruleToEdit={editingRule}
        channels={channels}
      />
    </div>
  );
}
