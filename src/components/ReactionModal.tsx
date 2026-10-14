'use client';

import React, { useState, useEffect } from 'react';
import { AutoReactionRule, PumbleChannel, ReactionTriggerType } from '@/types/pumble';
import { X, Plus, Trash2, Smile } from 'lucide-react';

interface ReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reaction: AutoReactionRule) => void;
  reactionToEdit?: AutoReactionRule | null;
  channels: PumbleChannel[];
}

const PRESET_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👀', '⚡', '🙌', '✅', '💯', '🤝', '💡', '🌟', '👏', '🤖'];

export function ReactionModal({
  isOpen,
  onClose,
  onSave,
  reactionToEdit,
  channels,
}: ReactionModalProps) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<ReactionTriggerType>('contains');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [emojis, setEmojis] = useState<string[]>(['👍']);
  const [customEmoji, setCustomEmoji] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'specific_channels' | 'direct_messages'>('all');
  const [targetChannelIds, setTargetChannelIds] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState(800);
  const [randomChancePercent, setRandomChancePercent] = useState(100);

  useEffect(() => {
    if (reactionToEdit) {
      setName(reactionToEdit.name);
      setTriggerType(reactionToEdit.triggerType);
      setKeywords(reactionToEdit.keywords.length > 0 ? reactionToEdit.keywords : ['']);
      setEmojis(reactionToEdit.emojis.length > 0 ? reactionToEdit.emojis : ['👍']);
      setTargetScope(reactionToEdit.targetScope);
      setTargetChannelIds(reactionToEdit.targetChannelIds || []);
      setDelayMs(reactionToEdit.delayMs ?? 800);
      setRandomChancePercent(reactionToEdit.randomChancePercent ?? 100);
    } else {
      setName('');
      setTriggerType('contains');
      setKeywords(['shipped', 'done']);
      setEmojis(['🚀', '🔥']);
      setTargetScope('all');
      setTargetChannelIds([]);
      setDelayMs(800);
      setRandomChancePercent(100);
    }
  }, [reactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddKeyword = () => setKeywords([...keywords, '']);
  const handleRemoveKeyword = (index: number) =>
    setKeywords(keywords.filter((_, i) => i !== index));
  const handleKeywordChange = (index: number, val: string) => {
    const updated = [...keywords];
    updated[index] = val;
    setKeywords(updated);
  };

  const toggleEmoji = (emoji: string) => {
    if (emojis.includes(emoji)) {
      if (emojis.length > 1) {
        setEmojis(emojis.filter((e) => e !== emoji));
      }
    } else {
      setEmojis([...emojis, emoji]);
    }
  };

  const addCustomEmoji = () => {
    if (customEmoji.trim() && !emojis.includes(customEmoji.trim())) {
      setEmojis([...emojis, customEmoji.trim()]);
      setCustomEmoji('');
    }
  };

  const toggleChannel = (channelId: string) => {
    setTargetChannelIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filteredKeywords = keywords.map((k) => k.trim()).filter(Boolean);
    if (filteredKeywords.length === 0 && triggerType === 'contains') return;
    if (emojis.length === 0) return;

    const rule: AutoReactionRule = {
      id: reactionToEdit ? reactionToEdit.id : 'react_' + Date.now(),
      name: name.trim(),
      triggerType,
      keywords: filteredKeywords,
      emojis,
      targetScope,
      targetChannelIds,
      delayMs: Number(delayMs) || 0,
      randomChancePercent: Number(randomChancePercent) || 100,
      enabled: reactionToEdit ? reactionToEdit.enabled : true,
      createdAt: reactionToEdit ? reactionToEdit.createdAt : new Date().toISOString(),
      reactionCount: reactionToEdit ? reactionToEdit.reactionCount : 0,
    };

    onSave(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {reactionToEdit ? 'Edit Auto-Reaction Rule' : 'Create Auto-Reaction Rule'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically react to messages in Pumble channels with emojis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Celebrate Shipped Updates or Acknowledge PRs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Trigger Condition */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trigger Triggering Condition
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as ReactionTriggerType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="contains">Contains Specific Keyword(s)</option>
              <option value="sentiment_positive">Positive Sentiment (great, thanks, fixed, etc.)</option>
              <option value="sentiment_negative">Urgent / Issues (broken, bug, down, error, etc.)</option>
              <option value="all">Every Message in Selected Channels</option>
            </select>
          </div>

          {/* Keywords */}
          {triggerType === 'contains' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Keywords to Trigger Reactions
                </label>
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Keyword
                </button>
              </div>

              <div className="space-y-2">
                {keywords.map((kw, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. deployed, congratulations, approved"
                      value={kw}
                      onChange={(e) => handleKeywordChange(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {keywords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="p-2 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emojis Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Emojis to React With ({emojis.length} selected)
            </label>

            <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl mb-3">
              {PRESET_EMOJIS.map((emoji) => {
                const isSelected = emojis.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleEmoji(emoji)}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-violet-600/40 border-2 border-violet-500 scale-105'
                        : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Custom Emoji Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or paste any custom emoji (e.g. 🥳 or :fire:)"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={addCustomEmoji}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-violet-300 font-medium rounded-xl text-xs"
              >
                Add Emoji
              </button>
            </div>
          </div>

          {/* Delay & Probability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Reaction Delay
                </label>
                <span className="text-xs font-mono text-violet-400">{delayMs} ms</span>
              </div>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Adds realistic human pause</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Reaction Probability
                </label>
                <span className="text-xs font-mono text-violet-400">{randomChancePercent}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={randomChancePercent}
                onChange={(e) => setRandomChancePercent(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Reduce to make bot appear natural</span>
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Scope
            </label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Channels & Groups</option>
              <option value="specific_channels">Specific Channels Only</option>
              <option value="direct_messages">Direct Messages Only</option>
            </select>
          </div>

          {targetScope === 'specific_channels' && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Select target channels:
              </span>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => {
                  const isSelected = targetChannelIds.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      #{ch.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/30 transition-colors"
            >
              {reactionToEdit ? 'Save Changes' : 'Create Auto-Reaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
