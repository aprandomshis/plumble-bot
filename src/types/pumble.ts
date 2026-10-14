export type TriggerType = 'exact' | 'contains' | 'regex' | 'mention' | 'all';
export type ResponseType = 'text' | 'random' | 'smart_ai';
export type TargetScope = 'all' | 'specific_channels' | 'direct_messages' | 'groups';

export interface AutoResponderRule {
  id: string;
  name: string;
  triggerType: TriggerType;
  triggers: string[];
  matchCase: boolean;
  responseType: ResponseType;
  responses: string[];
  aiPromptInstruction?: string; // Custom instruction for Groq AI
  targetScope: TargetScope;
  targetChannelIds: string[];
  excludedChannelIds: string[];
  cooldownSeconds: number;
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

export type ReactionTriggerType = 'contains' | 'sentiment_positive' | 'sentiment_negative' | 'ai_sentiment' | 'all';

export interface AutoReactionRule {
  id: string;
  name: string;
  triggerType: ReactionTriggerType;
  keywords: string[];
  emojis: string[];
  targetScope: 'all' | 'specific_channels' | 'direct_messages';
  targetChannelIds: string[];
  delayMs: number;
  randomChancePercent: number;
  enabled: boolean;
  createdAt: string;
  reactionCount: number;
}

export interface PumbleChannel {
  id: string;
  name: string;
  type: 'channel' | 'group' | 'dm';
  isPrivate: boolean;
  memberCount: number;
  autoResponderEnabled: boolean;
  autoReactEnabled: boolean;
  welcomeMessageEnabled: boolean;
  welcomeMessage?: string;
}

export type ScheduleFrequency = 'once' | 'daily' | 'weekdays' | 'interval';

export interface ScheduledMessage {
  id: string;
  title: string;
  content: string;
  channelId: string;
  channelName: string;
  scheduleType: ScheduleFrequency;
  timeOfDay?: string; // HH:mm
  intervalMinutes?: number;
  nextRunAt: string;
  lastRunAt?: string;
  enabled: boolean;
}

export type LogType = 'auto_reply' | 'auto_react' | 'scheduled_send' | 'webhook_received' | 'error' | 'groq_ai_call';
export type LogStatus = 'success' | 'failed' | 'ignored';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: LogType;
  channelId: string;
  channelName: string;
  senderName: string;
  incomingMessage?: string;
  actionTaken: string;
  ruleId?: string;
  ruleName?: string;
  status: LogStatus;
  details?: string;
}

export interface AccountSettings {
  botToken: string;
  workspaceId: string;
  botName: string;
  botAvatarUrl: string;
  signingSecret: string;
  isMasterBotActive: boolean;
  isAutoResponderActive: boolean;
  isAutoReactActive: boolean;
  enableWorkingHours: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  humanTypingDelayMs: number;
  // Groq AI Integration
  groqApiKey: string;
  groqModel: string;
  groqSystemPrompt: string;
  enableAiResponses: boolean;
  enableAiReactions: boolean;
}

export interface PumbleMessageEvent {
  id: string;
  workspaceId: string;
  channelId: string;
  channelName?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isBot?: boolean;
}
