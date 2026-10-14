'use client';

import React, { useState, useEffect } from 'react';
import { Storage } from '@/lib/storage';
import { AutoReactionRule, PumbleChannel } from '@/types/pumble';
import { ReactionModal } from '@/components/ReactionModal';
import { useToast } from '@/components/Toast';
import {
  SmilePlus,
  Plus,
  Search,
  Trash2,
  Edit2,
  Clock,
  Zap,
  Play,
  Percent,
} from 'lucide-react';

export default function ReactionsPage() {
  const [reactions, setReactions] = useState<AutoReactionRule[]>([]);
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReaction, setEditingReaction] = useState<AutoReactionRule | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setReactions(Storage.getReactions());
    setChannels(Storage.getChannels());
    setMounted(true);
  }, []);

  const handleSave = (saved: AutoReactionRule) => {
    let updated: AutoReactionRule[];
    const exists = reactions.some((r) => r.id === saved.id);
    if (exists) {
      updated = reactions.map((r) => (r.id === saved.id ? saved : r));
      showToast(`Updated reaction rule "${saved.name}"`, 'success');
    } else {
      updated = [saved, ...reactions];
      showToast(`Created auto-reaction "${saved.name}"`, 'success');
    }
    setReactions(updated);
    Storage.saveReactions(updated);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete reaction rule "${name}"?`)) {
      const updated = reactions.filter((r) => r.id !== id);
      setReactions(updated);
      Storage.saveReactions(updated);
      showToast(`Deleted "${name}"`, 'info');
    }
  };

  const handleToggle = (id: string) => {
    const updated = reactions.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setReactions(updated);
    Storage.saveReactions(updated);
  };

  const handleTestReaction = (r: AutoReactionRule) => {
    showToast(
      `Triggered! Added emojis ${r.emojis.join(' ')} with ${r.delayMs}ms delay (${r.randomChancePercent}% chance)`,
      'success'
    );
  };

  const filtered = reactions.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.keywords.some((k) => k.toLowerCase().includes(term)) ||
      r.emojis.some((e) => e.includes(term))
    );
  });

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <SmilePlus className="w-6 h-6 text-violet-400" />
            Auto-Reactions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automatically add emojis to messages based on keywords, sentiment, or team events in Pumble.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReaction(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Reaction Rule
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reaction rules by name, keyword, or emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium px-2 whitespace-nowrap">
          {filtered.length} of {reactions.length} rules
        </div>
      </div>

      {/* Grid of Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <SmilePlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Reaction Rules Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first reaction rule to automatically celebrate wins and acknowledge messages.
            </p>
          </div>
        ) : (
          filtered.map((rule) => (
            <div
              key={rule.id}
              className={`glow-card rounded-2xl p-5 flex flex-col justify-between transition-all ${
                !rule.enabled ? 'opacity-60 bg-slate-950/40' : ''
              }`}
            >
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{rule.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                        {rule.triggerType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        Scope: {rule.targetScope.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </div>

                {/* Emojis Display */}
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                    Attached Emojis:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rule.emojis.map((emoji, idx) => (
                      <span
                        key={idx}
                        className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords list */}
                {rule.triggerType === 'contains' && (
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                      Triggers on:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-mono"
                        >
                          &ldquo;{kw}&rdquo;
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Meta & Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1" title="Human delay">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{rule.delayMs}ms</span>
                  </div>
                  <div className="flex items-center gap-1" title="Probability">
                    <Percent className="w-3.5 h-3.5" />
                    <span>{rule.randomChancePercent}%</span>
                  </div>
                  <div>
                    <span>Used </span>
                    <strong className="text-slate-200">{rule.reactionCount}x</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestReaction(rule)}
                    title="Test reaction"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingReaction(rule);
                      setModalOpen(true);
                    }}
                    title="Edit reaction"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id, rule.name)}
                    title="Delete reaction"
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <ReactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        reactionToEdit={editingReaction}
        channels={channels}
      />
    </div>
  );
}
