import {
  AutoResponderRule,
  AutoReactionRule,
  PumbleChannel,
  ScheduledMessage,
  ActivityLog,
  AccountSettings,
} from '@/types/pumble';

export const DEFAULT_SETTINGS: AccountSettings = {
  botToken: '',
  workspaceId: 'ws_demo_98241',
  botName: 'PubleBot ⚡',
  botAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
  signingSecret: 'sec_sample_webhook_token_9831',
  isMasterBotActive: true,
  isAutoResponderActive: true,
  isAutoReactActive: true,
  enableWorkingHours: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  timezone: 'UTC',
  humanTypingDelayMs: 600,
  // Groq AI Defaults
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  groqSystemPrompt:
    'You are PubleBot, an intelligent and friendly assistant for the team chat. Answer concisely (1-3 sentences), warmly, and helpfully.',
  enableAiResponses: true,
  enableAiReactions: true,
};

export const DEFAULT_CHANNELS: PumbleChannel[] = [
  {
    id: 'ch_general',
    name: 'general',
    type: 'channel',
    isPrivate: false,
    memberCount: 42,
    autoResponderEnabled: true,
    autoReactEnabled: true,
    welcomeMessageEnabled: true,
    welcomeMessage: 'Welcome to the channel @{user}! Check pinned messages for guidelines.',
  },
  {
    id: 'ch_support',
    name: 'customer-support',
    type: 'channel',
    isPrivate: false,
    memberCount: 18,
    autoResponderEnabled: true,
    autoReactEnabled: true,
    welcomeMessageEnabled: false,
  },
  {
    id: 'ch_leads',
    name: 'sales-leads',
    type: 'group',
    isPrivate: true,
    memberCount: 8,
    autoResponderEnabled: true,
    autoReactEnabled: true,
    welcomeMessageEnabled: false,
  },
  {
    id: 'ch_dev',
    name: 'dev-standup',
    type: 'channel',
    isPrivate: false,
    memberCount: 14,
    autoResponderEnabled: false,
    autoReactEnabled: true,
    welcomeMessageEnabled: false,
  },
  {
    id: 'dm_client_1',
    name: 'Alex Vance (Direct Message)',
    type: 'dm',
    isPrivate: true,
    memberCount: 2,
    autoResponderEnabled: true,
    autoReactEnabled: true,
    welcomeMessageEnabled: false,
  },
];

export const DEFAULT_RESPONDER_RULES: AutoResponderRule[] = [
  {
    id: 'rule_ai_assistant',
    name: 'Groq AI Smart Assistant (Mention / Question)',
    triggerType: 'contains',
    triggers: ['@bot', 'publebot', 'ai help', 'can you explain', 'question'],
    matchCase: false,
    responseType: 'smart_ai',
    responses: ['[Groq Llama 3.3 will generate intelligent contextual answer]'],
    aiPromptInstruction: 'Provide a helpful, polite and concise answer. Offer next steps if applicable.',
    targetScope: 'all',
    targetChannelIds: [],
    excludedChannelIds: [],
    cooldownSeconds: 15,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    triggerCount: 74,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'rule_1',
    name: 'Support & Help Desk Ticket',
    triggerType: 'contains',
    triggers: ['help', 'support', 'issue', 'not working', 'error'],
    matchCase: false,
    responseType: 'random',
    responses: [
      'Hello @{user}! 👋 Our team received your request. An engineer will follow up within 15 minutes. In the meantime, you can check our docs at https://docs.puble.internal',
      'Hi @{user}, thank you for reaching out! We have logged this ticket and alerted the on-call team.',
    ],
    targetScope: 'all',
    targetChannelIds: [],
    excludedChannelIds: ['ch_dev'],
    cooldownSeconds: 60,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    triggerCount: 48,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'rule_2',
    name: 'Pricing & Sales Inquiries',
    triggerType: 'contains',
    triggers: ['pricing', 'cost', 'quote', 'enterprise plan', 'discount'],
    matchCase: false,
    responseType: 'text',
    responses: [
      'Hey @{user}! 💼 Our standard tier starts at $12/seat/month, and enterprise includes custom SLAs. Check details here: https://puble.io/pricing or reply to schedule a demo call with our sales lead!',
    ],
    targetScope: 'specific_channels',
    targetChannelIds: ['ch_leads', 'ch_general'],
    excludedChannelIds: [],
    cooldownSeconds: 120,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    triggerCount: 29,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'rule_4',
    name: 'System Status Quick Check',
    triggerType: 'exact',
    triggers: ['!status', '/status', 'ping'],
    matchCase: false,
    responseType: 'text',
    responses: [
      '✅ All Puble Services Operational | API Latency: 42ms | Groq AI Inference: Active ⚡',
    ],
    targetScope: 'all',
    targetChannelIds: [],
    excludedChannelIds: [],
    cooldownSeconds: 10,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    triggerCount: 114,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const DEFAULT_REACTION_RULES: AutoReactionRule[] = [
  {
    id: 'react_ai_sentiment',
    name: 'Groq AI Sentiment Auto-React',
    triggerType: 'ai_sentiment',
    keywords: [],
    emojis: ['🤖', '✨'],
    targetScope: 'all',
    targetChannelIds: [],
    delayMs: 600,
    randomChancePercent: 100,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    reactionCount: 52,
  },
  {
    id: 'react_1',
    name: 'Celebrate Deployments & Milestones',
    triggerType: 'contains',
    keywords: ['shipped', 'deployed', 'released', 'congrats', 'promoted', 'launched'],
    emojis: ['🎉', '🚀', '🔥', '🙌'],
    targetScope: 'all',
    targetChannelIds: [],
    delayMs: 1200,
    randomChancePercent: 100,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reactionCount: 65,
  },
  {
    id: 'react_2',
    name: 'Acknowledge Tasks & Approvals',
    triggerType: 'contains',
    keywords: ['done', 'finished', 'approved', 'merged', 'pr merged', 'resolved'],
    emojis: ['✅', '👍'],
    targetScope: 'all',
    targetChannelIds: [],
    delayMs: 800,
    randomChancePercent: 100,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reactionCount: 142,
  },
  {
    id: 'react_3',
    name: 'Gratitude & Appreciation',
    triggerType: 'contains',
    keywords: ['thanks', 'thank you', 'tyvm', 'appreciated', 'great job'],
    emojis: ['❤️', '🙏'],
    targetScope: 'all',
    targetChannelIds: [],
    delayMs: 1000,
    randomChancePercent: 90,
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reactionCount: 93,
  },
];

export const DEFAULT_SCHEDULED: ScheduledMessage[] = [
  {
    id: 'sched_1',
    title: 'Daily Morning Standup Kickoff',
    content: '🌅 Good morning team! Please drop your 3 bullet points: 1) What you did yesterday, 2) Focus for today, 3) Any blockers.',
    channelId: 'ch_dev',
    channelName: 'dev-standup',
    scheduleType: 'weekdays',
    timeOfDay: '09:30',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(),
    enabled: true,
  },
  {
    id: 'sched_2',
    title: 'Friday Wrap-up & Wins',
    content: '🥂 Happy Friday! Remember to submit timesheets and share your best win of the week below!',
    channelId: 'ch_general',
    channelName: 'general',
    scheduleType: 'once',
    timeOfDay: '16:00',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    enabled: true,
  },
];

export const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'log_groq_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    type: 'groq_ai_call',
    channelId: 'ch_general',
    channelName: 'general',
    senderName: 'David Lee',
    incomingMessage: '@bot Can you explain how our deployment pipeline works?',
    actionTaken: 'Groq Llama 3.3 generated contextual 2-sentence summary (182ms)',
    ruleId: 'rule_ai_assistant',
    ruleName: 'Groq AI Smart Assistant',
    status: 'success',
  },
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    type: 'auto_reply',
    channelId: 'ch_general',
    channelName: 'general',
    senderName: 'Sarah Connor',
    incomingMessage: '!status',
    actionTaken: 'Replied: ✅ All Puble Services Operational...',
    ruleId: 'rule_4',
    ruleName: 'System Status Quick Check',
    status: 'success',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'auto_react',
    channelId: 'ch_support',
    channelName: 'customer-support',
    senderName: 'Emma Watson',
    incomingMessage: 'We just shipped the emergency patch!',
    actionTaken: 'Added reaction: 🚀 🎉',
    ruleId: 'react_1',
    ruleName: 'Celebrate Deployments & Milestones',
    status: 'success',
  },
];

const KEYS = {
  RULES: 'puble_responder_rules',
  REACTIONS: 'puble_reaction_rules',
  CHANNELS: 'puble_channels',
  SCHEDULED: 'puble_scheduled',
  LOGS: 'puble_activity_logs',
  SETTINGS: 'puble_account_settings',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const Storage = {
  getRules: (): AutoResponderRule[] => safeGet(KEYS.RULES, DEFAULT_RESPONDER_RULES),
  saveRules: (rules: AutoResponderRule[]): void => safeSet(KEYS.RULES, rules),

  getReactions: (): AutoReactionRule[] => safeGet(KEYS.REACTIONS, DEFAULT_REACTION_RULES),
  saveReactions: (reactions: AutoReactionRule[]): void => safeSet(KEYS.REACTIONS, reactions),

  getChannels: (): PumbleChannel[] => safeGet(KEYS.CHANNELS, DEFAULT_CHANNELS),
  saveChannels: (channels: PumbleChannel[]): void => safeSet(KEYS.CHANNELS, channels),

  getScheduled: (): ScheduledMessage[] => safeGet(KEYS.SCHEDULED, DEFAULT_SCHEDULED),
  saveScheduled: (scheduled: ScheduledMessage[]): void => safeSet(KEYS.SCHEDULED, scheduled),

  getLogs: (): ActivityLog[] => safeGet(KEYS.LOGS, DEFAULT_LOGS),
  saveLogs: (logs: ActivityLog[]): void => safeSet(KEYS.LOGS, logs),
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
    const current = Storage.getLogs();
    const newEntry: ActivityLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };
    Storage.saveLogs([newEntry, ...current].slice(0, 200));
  },

  getSettings: (): AccountSettings => safeGet(KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (settings: AccountSettings): void => safeSet(KEYS.SETTINGS, settings),

  resetToDefaults: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.RULES);
    localStorage.removeItem(KEYS.REACTIONS);
    localStorage.removeItem(KEYS.CHANNELS);
    localStorage.removeItem(KEYS.SCHEDULED);
    localStorage.removeItem(KEYS.LOGS);
    localStorage.removeItem(KEYS.SETTINGS);
  },
};
