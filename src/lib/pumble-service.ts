import {
  AutoResponderRule,
  AutoReactionRule,
  AccountSettings,
  PumbleChannel,
} from '@/types/pumble';
import { generateGroqAutoReply, generateGroqEmojiReactions } from './groq';

export interface AutomationResult {
  repliesSent: {
    ruleId: string;
    ruleName: string;
    response: string;
    isAi?: boolean;
    aiModel?: string;
    latencyMs?: number;
  }[];
  reactionsAdded: {
    ruleId: string;
    ruleName: string;
    emojis: string[];
    delayMs: number;
    isAi?: boolean;
  }[];
  skippedReasons: string[];
}

export function formatTemplate(
  template: string,
  variables: { user: string; channel: string }
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString();

  return template
    .replace(/\{user\}/gi, variables.user)
    .replace(/\{channel\}/gi, variables.channel)
    .replace(/\{time\}/gi, timeStr)
    .replace(/\{date\}/gi, dateStr);
}

export function isWithinWorkingHours(settings: AccountSettings): boolean {
  if (!settings.enableWorkingHours) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.workingHoursStart.split(':').map(Number);
  const [endH, endM] = settings.workingHoursEnd.split(':').map(Number);

  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

export function doesMessageMatchRule(
  text: string,
  rule: AutoResponderRule
): boolean {
  if (!text) return false;
  const processedText = rule.matchCase ? text : text.toLowerCase();

  switch (rule.triggerType) {
    case 'all':
      return true;

    case 'exact':
      return rule.triggers.some((tr) => {
        const compare = rule.matchCase ? tr : tr.toLowerCase();
        return processedText.trim() === compare.trim();
      });

    case 'contains':
      return rule.triggers.some((tr) => {
        const compare = rule.matchCase ? tr : tr.toLowerCase();
        return processedText.includes(compare);
      });

    case 'mention':
      return rule.triggers.some((tr) => {
        const compare = rule.matchCase ? tr : tr.toLowerCase();
        return processedText.includes(compare);
      });

    case 'regex':
      return rule.triggers.some((tr) => {
        try {
          const rx = new RegExp(tr, rule.matchCase ? 'g' : 'gi');
          return rx.test(text);
        } catch {
          return false;
        }
      });

    default:
      return false;
  }
}

export function doesMessageMatchReaction(
  text: string,
  rule: AutoReactionRule
): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  switch (rule.triggerType) {
    case 'all':
    case 'ai_sentiment':
      return true;

    case 'contains':
      return rule.keywords.some((kw) => lower.includes(kw.toLowerCase().trim()));

    case 'sentiment_positive': {
      const positiveWords = [
        'great', 'awesome', 'thank', 'thanks', 'love', 'congrats', 'good', 'nice',
        'solved', 'fixed', 'works', 'shipped', 'done', 'perfect', 'cheers'
      ];
      return positiveWords.some((w) => lower.includes(w));
    }

    case 'sentiment_negative': {
      const negativeWords = [
        'broken', 'error', 'bug', 'down', 'fail', 'failing', 'issue', 'problem',
        'crash', 'urgent', 'help', 'bad'
      ];
      return negativeWords.some((w) => lower.includes(w));
    }

    default:
      return false;
  }
}

/**
 * Async processing that evaluates both static rules and dynamic Groq AI generation
 */
export async function processIncomingMessageAsync(
  text: string,
  channel: PumbleChannel,
  sender: { id: string; name: string; isBot?: boolean },
  rules: AutoResponderRule[],
  reactions: AutoReactionRule[],
  settings: AccountSettings
): Promise<AutomationResult> {
  const result: AutomationResult = {
    repliesSent: [],
    reactionsAdded: [],
    skippedReasons: [],
  };

  if (sender.isBot) {
    result.skippedReasons.push('Ignored bot message to prevent recursion');
    return result;
  }

  if (!settings.isMasterBotActive) {
    result.skippedReasons.push('Master bot is deactivated');
    return result;
  }

  if (!isWithinWorkingHours(settings)) {
    result.skippedReasons.push('Outside of active working hours');
    return result;
  }

  // 1. Evaluate Auto-Responders
  if (settings.isAutoResponderActive && channel.autoResponderEnabled) {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      if (rule.targetScope === 'specific_channels' && !rule.targetChannelIds.includes(channel.id)) {
        continue;
      }
      if (rule.targetScope === 'direct_messages' && channel.type !== 'dm') {
        continue;
      }
      if (rule.targetScope === 'groups' && channel.type !== 'group') {
        continue;
      }
      if (rule.excludedChannelIds?.includes(channel.id)) {
        continue;
      }

      // Cooldown check
      if (rule.lastTriggeredAt && rule.cooldownSeconds > 0) {
        const lastTime = new Date(rule.lastTriggeredAt).getTime();
        const diffSec = (Date.now() - lastTime) / 1000;
        if (diffSec < rule.cooldownSeconds) {
          result.skippedReasons.push(
            `Rule "${rule.name}" in cooldown (${Math.ceil(rule.cooldownSeconds - diffSec)}s remaining)`
          );
          continue;
        }
      }

      if (doesMessageMatchRule(text, rule)) {
        if (rule.responseType === 'smart_ai') {
          // Call Groq AI API
          const aiResponse = await generateGroqAutoReply({
            incomingMessage: text,
            senderName: sender.name,
            channelName: channel.name,
            systemPrompt: settings.groqSystemPrompt,
            ruleInstruction: rule.aiPromptInstruction,
            apiKey: settings.groqApiKey,
            model: settings.groqModel,
          });

          result.repliesSent.push({
            ruleId: rule.id,
            ruleName: rule.name,
            response: aiResponse.content,
            isAi: true,
            aiModel: aiResponse.model,
            latencyMs: aiResponse.latencyMs,
          });
        } else {
          // Static or Random Choice
          let chosenResponse = rule.responses[0] || 'Hello!';
          if (rule.responseType === 'random' && rule.responses.length > 1) {
            const randomIndex = Math.floor(Math.random() * rule.responses.length);
            chosenResponse = rule.responses[randomIndex];
          }

          const formatted = formatTemplate(chosenResponse, {
            user: sender.name,
            channel: channel.name,
          });

          result.repliesSent.push({
            ruleId: rule.id,
            ruleName: rule.name,
            response: formatted,
            isAi: false,
          });
        }

        break; // Match top responder rule
      }
    }
  }

  // 2. Evaluate Auto-Reactions
  if (settings.isAutoReactActive && channel.autoReactEnabled) {
    for (const reaction of reactions) {
      if (!reaction.enabled) continue;

      if (
        reaction.targetScope === 'specific_channels' &&
        !reaction.targetChannelIds.includes(channel.id)
      ) {
        continue;
      }
      if (reaction.targetScope === 'direct_messages' && channel.type !== 'dm') {
        continue;
      }

      if (reaction.randomChancePercent < 100) {
        if (Math.random() * 100 > reaction.randomChancePercent) continue;
      }

      if (reaction.triggerType === 'ai_sentiment' && settings.enableAiReactions) {
        // Groq AI dynamic sentiment reactions
        const aiReactResult = await generateGroqEmojiReactions({
          incomingMessage: text,
          senderName: sender.name,
          apiKey: settings.groqApiKey,
          model: 'llama-3.1-8b-instant',
        });

        result.reactionsAdded.push({
          ruleId: reaction.id,
          ruleName: reaction.name,
          emojis: aiReactResult.emojis,
          delayMs: reaction.delayMs || 500,
          isAi: true,
        });
      } else if (doesMessageMatchReaction(text, reaction)) {
        result.reactionsAdded.push({
          ruleId: reaction.id,
          ruleName: reaction.name,
          emojis: reaction.emojis,
          delayMs: reaction.delayMs || 500,
          isAi: false,
        });
      }
    }
  }

  return result;
}

/**
 * Pumble REST API Integration
 */
export async function sendPumbleMessageApi(
  token: string,
  workspaceId: string,
  channelId: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!token) {
    return {
      success: true,
      data: { mock: true, message: 'Simulated API call (No token provided, mock mode active)' },
    };
  }

  try {
    const res = await fetch(`https://api.pumble.com/workspaces/${workspaceId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channelId,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Pumble API HTTP ${res.status}: ${err}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Network error communicating with Pumble API' };
  }
}

export async function sendPumbleReactionApi(
  token: string,
  workspaceId: string,
  channelId: string,
  messageId: string,
  emoji: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!token) {
    return {
      success: true,
      data: { mock: true, message: 'Simulated reaction API call' },
    };
  }

  try {
    const res = await fetch(
      `https://api.pumble.com/workspaces/${workspaceId}/messages/${messageId}/reactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Pumble Reaction API HTTP ${res.status}: ${err}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to post reaction' };
  }
}
