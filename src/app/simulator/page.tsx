'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Storage } from '@/lib/storage';
import {
  PumbleChannel,
  AutoResponderRule,
  AutoReactionRule,
  AccountSettings,
} from '@/types/pumble';
import { processIncomingMessageAsync } from '@/lib/pumble-service';
import { useToast } from '@/components/Toast';
import {
  Terminal,
  Send,
  Hash,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Info,
  Clock,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderName: string;
  isBot: boolean;
  isAi?: boolean;
  avatar?: string;
  text: string;
  timestamp: string;
  reactions: string[];
  latencyMs?: number;
}

export default function SimulatorPage() {
  const [channels, setChannels] = useState<PumbleChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<PumbleChannel | null>(null);
  const [rules, setRules] = useState<AutoResponderRule[]>([]);
  const [reactions, setReactions] = useState<AutoReactionRule[]>([]);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string>('typing...');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const chs = Storage.getChannels();
    const rls = Storage.getRules();
    const rcts = Storage.getReactions();
    const stgs = Storage.getSettings();

    setChannels(chs);
    if (chs.length > 0) setSelectedChannel(chs[0]);
    setRules(rls);
    setReactions(rcts);
    setSettings(stgs);
    setMounted(true);

    // Initial greeting in channel
    setMessages([
      {
        id: 'msg_welcome',
        senderName: 'PubleBot ⚡',
        isBot: true,
        isAi: true,
        text: '👋 Simulator Ready with Groq AI Llama 3.3. Type any keyword (e.g. "@bot what is this?", "!status", "shipped", "pricing") to test auto-reactions and auto-replies in real time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: ['🤖', '⚡'],
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const addDebugLog = (msg: string) => {
    setDebugLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!messageText || !selectedChannel || !settings) return;

    const userMsgId = 'msg_' + Date.now();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: ChatMessage = {
      id: userMsgId,
      senderName: 'Sarah Jenkins (Team)',
      isBot: false,
      text: messageText,
      timestamp: nowTime,
      reactions: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    addDebugLog(`Received message in #${selectedChannel.name}: "${messageText}"`);

    // Show indicator if AI might process
    setTypingStatus('analyzing rules...');
    setIsBotTyping(true);

    try {
      // Process using Pumble + Groq engine asynchronously
      const result = await processIncomingMessageAsync(
        messageText,
        selectedChannel,
        { id: 'usr_test_1', name: 'Sarah Jenkins', isBot: false },
        rules,
        reactions,
        settings
      );

      // 1. Handle Auto-Reactions
      if (result.reactionsAdded.length > 0) {
        result.reactionsAdded.forEach((reactRule) => {
          addDebugLog(
            `Triggered reaction rule "${reactRule.ruleName}" (${reactRule.emojis.join(' ')})${
              reactRule.isAi ? ' via Groq Sentiment' : ''
            }`
          );

          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === userMsgId) {
                  const combined = Array.from(new Set([...msg.reactions, ...reactRule.emojis]));
                  return { ...msg, reactions: combined };
                }
                return msg;
              })
            );

            // Update reaction hit count
            const updatedReactions = Storage.getReactions().map((r) =>
              r.id === reactRule.ruleId ? { ...r, reactionCount: (r.reactionCount || 0) + 1 } : r
            );
            Storage.saveReactions(updatedReactions);

            Storage.addLog({
              type: reactRule.isAi ? 'groq_ai_call' : 'auto_react',
              channelId: selectedChannel.id,
              channelName: selectedChannel.name,
              senderName: 'Sarah Jenkins',
              incomingMessage: messageText,
              actionTaken: `Added emoji reactions: ${reactRule.emojis.join(' ')}`,
              ruleId: reactRule.ruleId,
              ruleName: reactRule.ruleName,
              status: 'success',
            });
          }, reactRule.delayMs || 400);
        });
      }

      // 2. Handle Auto-Responders
      if (result.repliesSent.length > 0) {
        const topReply = result.repliesSent[0];
        setTypingStatus(
          topReply.isAi
            ? `generating reply via Groq ${settings.groqModel}...`
            : 'typing reply...'
        );

        addDebugLog(
          `Matched rule "${topReply.ruleName}". ${
            topReply.isAi ? `Groq AI Inference latency: ${topReply.latencyMs}ms` : 'Static reply'
          }`
        );

        const typingDelay = topReply.isAi
          ? 300 // Groq is fast, keep simulation prompt snappy
          : Math.max(settings.humanTypingDelayMs || 600, 400);

        setTimeout(() => {
          setIsBotTyping(false);
          const botMsg: ChatMessage = {
            id: 'bot_msg_' + Date.now(),
            senderName: settings.botName,
            isBot: true,
            isAi: topReply.isAi,
            latencyMs: topReply.latencyMs,
            text: topReply.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: [],
          };

          setMessages((prev) => [...prev, botMsg]);

          // Update trigger count
          const updatedRules = Storage.getRules().map((r) =>
            r.id === topReply.ruleId
              ? {
                  ...r,
                  triggerCount: (r.triggerCount || 0) + 1,
                  lastTriggeredAt: new Date().toISOString(),
                }
              : r
          );
          Storage.saveRules(updatedRules);

          // Add to log
          Storage.addLog({
            type: topReply.isAi ? 'groq_ai_call' : 'auto_reply',
            channelId: selectedChannel.id,
            channelName: selectedChannel.name,
            senderName: 'Sarah Jenkins',
            incomingMessage: messageText,
            actionTaken: topReply.isAi
              ? `Groq Llama generated: "${topReply.response.slice(0, 50)}..." (${topReply.latencyMs}ms)`
              : `Auto-replied: "${topReply.response.slice(0, 50)}..."`,
            ruleId: topReply.ruleId,
            ruleName: topReply.ruleName,
            status: 'success',
          });
        }, typingDelay);
      } else {
        setIsBotTyping(false);
        if (result.skippedReasons.length > 0) {
          addDebugLog(`No reply triggered. (${result.skippedReasons.join(', ')})`);
        } else {
          addDebugLog('No matching responder rule for this text.');
        }
      }
    } catch (err: any) {
      setIsBotTyping(false);
      addDebugLog(`Error in processing: ${err?.message}`);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'msg_welcome_' + Date.now(),
        senderName: settings?.botName || 'PubleBot ⚡',
        isBot: true,
        text: 'Simulator reset. Channel history cleared.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: ['🧹'],
      },
    ]);
    setDebugLogs([]);
    showToast('Chat history cleared', 'info');
  };

  if (!mounted || !selectedChannel) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-emerald-400" />
            Live Chat &amp; Groq AI Simulator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test your auto-responders, Groq AI Llama 3 generation, and emoji reactions in real time.
          </p>
        </div>

        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Chat
        </button>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat Window (2 cols on lg) */}
        <div className="lg:col-span-2 glow-card rounded-2xl flex flex-col h-[650px] overflow-hidden border border-slate-800">
          {/* Chat Header Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Channel:
              </span>
              <div className="flex items-center gap-1.5">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedChannel.id === ch.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    #{ch.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Simulated Pumble Client</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                  msg.isBot
                    ? msg.isAi
                      ? 'bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/20'
                      : 'bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-500/10'
                    : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    msg.isBot
                      ? msg.isAi
                        ? 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-md shadow-amber-500/20'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-700'
                  }`}
                >
                  {msg.isBot ? (
                    msg.isAi ? (
                      <Zap className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{msg.senderName}</span>
                    {msg.isBot && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          msg.isAi
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {msg.isAi ? 'GROQ AI ⚡' : 'APP'}
                      </span>
                    )}
                    {msg.latencyMs && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        {msg.latencyMs}ms
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Emoji Reactions */}
                  {msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {msg.reactions.map((emoji, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2.5 py-0.5 rounded-full text-xs animate-in zoom-in-75 text-slate-200"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] text-slate-400 font-mono">1</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isBotTyping && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20 animate-in fade-in">
                <div className="w-9 h-9 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                  <span>{typingStatus}</span>
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Trigger Chips */}
          <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-2 whitespace-nowrap">
              Test Triggers:
            </span>
            {[
              '@bot Explain our core features',
              '!status',
              'can you help me with pricing?',
              'we just shipped the release!',
              'thanks team!',
              'urgent production bug',
            ].map((pill) => (
              <button
                key={pill}
                onClick={() => handleSendMessage(pill)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-amber-500/20 whitespace-nowrap transition-colors"
              >
                &ldquo;{pill}&rdquo;
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
            <input
              type="text"
              placeholder={`Send message to #${selectedChannel.name} (try @bot, !status, shipped)...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-600/30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Debug & Engine Inspection Logs (1 col) */}
        <div className="glow-card rounded-2xl p-5 flex flex-col h-[650px] border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Groq AI &amp; Engine Inspector
            </h3>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
              {settings?.groqModel || 'Llama 3.3'}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>AI Auto-Replies:</span>
                <span className="font-semibold text-amber-400">
                  {settings?.enableAiResponses ? 'Enabled ⚡' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>AI Sentiment Reactions:</span>
                <span className="font-semibold text-amber-400">
                  {settings?.enableAiReactions ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Engine:</span>
                <span className="font-mono text-slate-200">Groq API</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Execution Log:
          </span>

          <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800/80 overflow-y-auto font-mono text-[11px] space-y-2 text-slate-300">
            {debugLogs.length === 0 ? (
              <div className="text-slate-600 italic">No events processed yet...</div>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-slate-900 pb-1.5">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
