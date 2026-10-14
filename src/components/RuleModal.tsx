'use client';

import React, { useState, useEffect } from 'react';
import { AutoResponderRule, PumbleChannel, TriggerType, ResponseType, TargetScope } from '@/types/pumble';
import { X, Plus, Trash2, Sparkles, Bot, Zap, HelpCircle } from 'lucide-react';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AutoResponderRule) => void;
  ruleToEdit?: AutoResponderRule | null;
  channels: PumbleChannel[];
}

export function RuleModal({
  isOpen,
  onClose,
  onSave,
  ruleToEdit,
  channels,
}: RuleModalProps) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('contains');
  const [triggers, setTriggers] = useState<string[]>(['']);
  const [matchCase, setMatchCase] = useState(false);
  const [responseType, setResponseType] = useState<ResponseType>('text');
  const [responses, setResponses] = useState<string[]>(['']);
  const [aiPromptInstruction, setAiPromptInstruction] = useState('');
  const [targetScope, setTargetScope] = useState<TargetScope>('all');
  const [targetChannelIds, setTargetChannelIds] = useState<string[]>([]);
  const [excludedChannelIds, setExcludedChannelIds] = useState<string[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(30);

  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name);
      setTriggerType(ruleToEdit.triggerType);
      setTriggers(ruleToEdit.triggers.length > 0 ? ruleToEdit.triggers : ['']);
      setMatchCase(ruleToEdit.matchCase);
      setResponseType(ruleToEdit.responseType);
      setResponses(ruleToEdit.responses.length > 0 ? ruleToEdit.responses : ['']);
      setAiPromptInstruction(ruleToEdit.aiPromptInstruction || '');
      setTargetScope(ruleToEdit.targetScope);
      setTargetChannelIds(ruleToEdit.targetChannelIds || []);
      setExcludedChannelIds(ruleToEdit.excludedChannelIds || []);
      setCooldownSeconds(ruleToEdit.cooldownSeconds || 0);
    } else {
      setName('');
      setTriggerType('contains');
      setTriggers(['support', 'help']);
      setMatchCase(false);
      setResponseType('text');
      setResponses(['Hi @{user}, thank you for reaching out! How can we assist you today?']);
      setAiPromptInstruction('Answer the user politely and concisely, providing immediate troubleshooting guidance.');
      setTargetScope('all');
      setTargetChannelIds([]);
      setExcludedChannelIds([]);
      setCooldownSeconds(30);
    }
  }, [ruleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTrigger = () => setTriggers([...triggers, '']);
  const handleRemoveTrigger = (index: number) =>
    setTriggers(triggers.filter((_, i) => i !== index));
  const handleTriggerChange = (index: number, val: string) => {
    const updated = [...triggers];
    updated[index] = val;
    setTriggers(updated);
  };

  const handleAddResponse = () => setResponses([...responses, '']);
  const handleRemoveResponse = (index: number) =>
    setResponses(responses.filter((_, i) => i !== index));
  const handleResponseChange = (index: number, val: string) => {
    const updated = [...responses];
    updated[index] = val;
    setResponses(updated);
  };

  const insertVariable = (index: number, variable: string) => {
    const updated = [...responses];
    updated[index] = (updated[index] || '') + variable;
    setResponses(updated);
  };

  const toggleChannel = (channelId: string, isTarget: boolean) => {
    if (isTarget) {
      setTargetChannelIds((prev) =>
        prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
      );
    } else {
      setExcludedChannelIds((prev) =>
        prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filteredTriggers = triggers.map((t) => t.trim()).filter(Boolean);
    const filteredResponses = responses.map((r) => r.trim()).filter(Boolean);

    if (filteredTriggers.length === 0 && triggerType !== 'all') return;
    if (responseType !== 'smart_ai' && filteredResponses.length === 0) return;

    const rule: AutoResponderRule = {
      id: ruleToEdit ? ruleToEdit.id : 'rule_' + Date.now(),
      name: name.trim(),
      triggerType,
      triggers: filteredTriggers,
      matchCase,
      responseType,
      responses:
        responseType === 'smart_ai'
          ? ['[Generated dynamically via Groq Llama 3]']
          : filteredResponses,
      aiPromptInstruction: responseType === 'smart_ai' ? aiPromptInstruction : undefined,
      targetScope,
      targetChannelIds,
      excludedChannelIds,
      cooldownSeconds: Number(cooldownSeconds) || 0,
      enabled: ruleToEdit ? ruleToEdit.enabled : true,
      createdAt: ruleToEdit ? ruleToEdit.createdAt : new Date().toISOString(),
      triggerCount: ruleToEdit ? ruleToEdit.triggerCount : 0,
      lastTriggeredAt: ruleToEdit ? ruleToEdit.lastTriggeredAt : undefined,
    };

    onSave(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {ruleToEdit ? 'Edit Auto-Responder Rule' : 'Create New Auto-Responder'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define triggers, automated replies, or Groq AI generative responses
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Customer Triage, FAQ Pricing, or Welcome Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Trigger Type & Case Sensitivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Trigger Matching Mode
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="contains">Contains Keyword(s)</option>
                <option value="exact">Exact Match</option>
                <option value="mention">Bot Mention (@bot)</option>
                <option value="regex">Regex Expression</option>
                <option value="all">Every Message in Channel</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-medium">Case-Sensitive Matching</span>
              </label>
            </div>
          </div>

          {/* Triggers Input */}
          {triggerType !== 'all' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {triggerType === 'regex' ? 'Regex Patterns' : 'Trigger Keywords'}
                </label>
                <button
                  type="button"
                  onClick={handleAddTrigger}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Keyword
                </button>
              </div>

              <div className="space-y-2">
                {triggers.map((trigger, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={triggerType === 'regex' ? '^(!help|help\\s+me)' : 'e.g. pricing, quote, sales, @bot'}
                      value={trigger}
                      onChange={(e) => handleTriggerChange(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {triggers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrigger(idx)}
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

          {/* Response Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Response Generation Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setResponseType('text')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  responseType === 'text'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">Static Text</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Fixed reply template</div>
              </button>

              <button
                type="button"
                onClick={() => setResponseType('random')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  responseType === 'random'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-200">Random Pool</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Rotates between variants</div>
              </button>

              <button
                type="button"
                onClick={() => setResponseType('smart_ai')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  responseType === 'smart_ai'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5 text-amber-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Groq AI ⚡
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Llama 3.3 Dynamic Reply</div>
              </button>
            </div>

            {/* Groq AI Prompt Instruction Input */}
            {responseType === 'smart_ai' ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Groq AI Prompt Instruction for this Rule
                </div>
                <p className="text-[11px] text-slate-400">
                  Tell Groq AI how it should answer when this rule triggers. It will read the incoming user message and generate a tailored answer.
                </p>
                <textarea
                  rows={3}
                  value={aiPromptInstruction}
                  onChange={(e) => setAiPromptInstruction(e.target.value)}
                  placeholder="e.g. Answer politely as technical support. Check if they have an active ticket number and explain our troubleshooting steps."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="text-slate-400">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAiPromptInstruction(
                        'Provide a helpful 2-sentence technical troubleshooting response and offer to escalate to an engineer.'
                      )
                    }
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-800"
                  >
                    Tech Support
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAiPromptInstruction(
                        'Explain our standard tier ($12/user) and offer to schedule an enterprise demo call.'
                      )
                    }
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-800"
                  >
                    Sales Lead
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAiPromptInstruction(
                        'Give an enthusiastic team celebration response congratulating the members on their achievements.'
                      )
                    }
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-800"
                  >
                    Celebration
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Static / Random text responses */
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Response Text
                  </span>
                  {responseType === 'random' && (
                    <button
                      type="button"
                      onClick={handleAddResponse}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variant
                    </button>
                  )}
                </div>

                {responses.map((resp, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {responseType === 'random' ? `Variant #${idx + 1}` : 'Bot Response Text'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Insert:</span>
                        <button
                          type="button"
                          onClick={() => insertVariable(idx, '@{user}')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          @&#123;user&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable(idx, '#{channel}')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          #&#123;channel&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable(idx, '{time}')}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          &#123;time&#125;
                        </button>
                        {responses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveResponse(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Write the message the bot will automatically reply with..."
                      value={resp}
                      onChange={(e) => handleResponseChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scope & Channel Targeting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Channels / Scope
              </label>
              <select
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value as TargetScope)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Channels & Groups</option>
                <option value="specific_channels">Specific Channels Only</option>
                <option value="direct_messages">Direct Messages (DMs) Only</option>
                <option value="groups">Private Groups Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Cooldown (Seconds between triggers)
              </label>
              <input
                type="number"
                min={0}
                max={3600}
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Specific Channel Selector */}
          {targetScope === 'specific_channels' && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Select channels to activate this responder on:
              </span>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => {
                  const isSelected = targetChannelIds.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id, true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
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

          {/* Excluded Channels */}
          {targetScope === 'all' && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="block text-xs font-medium text-slate-400 mb-2">
                Exclude channels from this rule:
              </span>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => {
                  const isExcluded = excludedChannelIds.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id, false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isExcluded
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isExcluded ? '✕ ' : ''}#{ch.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-colors"
            >
              {ruleToEdit ? 'Save Changes' : 'Create Auto-Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
