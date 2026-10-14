import { NextRequest, NextResponse } from 'next/server';
import {
  doesMessageMatchRule,
  doesMessageMatchReaction,
  formatTemplate,
  sendPumbleMessageApi,
  sendPumbleReactionApi,
} from '@/lib/pumble-service';
import {
  generateGroqAutoReply,
  generateGroqEmojiReactions,
} from '@/lib/groq';
import {
  DEFAULT_RESPONDER_RULES,
  DEFAULT_REACTION_RULES,
  DEFAULT_SETTINGS,
  DEFAULT_CHANNELS,
} from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Pumble / Slack URL Verification Challenge
    if (body.type === 'url_verification' || body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. Extract Event Data
    const event = body.event || body;
    const text = event.text || event.message?.text || '';
    const channelId = event.channelId || event.channel || 'ch_general';
    const messageId = event.id || event.messageId || 'msg_' + Date.now();
    const sender = event.user || event.sender || { name: 'Pumble User', id: 'usr_unknown' };
    const senderName = typeof sender === 'string' ? sender : sender.name || 'User';
    const isBot = event.bot || sender.isBot || false;

    // Ignore bot messages to prevent loop
    if (isBot) {
      return NextResponse.json({ ok: true, ignored: 'Bot message' });
    }

    const token = process.env.PUMBLE_BOT_TOKEN || DEFAULT_SETTINGS.botToken;
    const workspaceId = process.env.PUMBLE_WORKSPACE_ID || DEFAULT_SETTINGS.workspaceId;
    const groqApiKey = process.env.GROQ_API_KEY || DEFAULT_SETTINGS.groqApiKey;
    const groqModel = process.env.GROQ_MODEL || DEFAULT_SETTINGS.groqModel;

    const matchedChannel =
      DEFAULT_CHANNELS.find((c) => c.id === channelId) || {
        id: channelId,
        name: channelId,
        type: 'channel' as const,
        isPrivate: false,
        memberCount: 1,
        autoResponderEnabled: true,
        autoReactEnabled: true,
        welcomeMessageEnabled: false,
      };

    const actionsPerformed: any[] = [];

    // 3. Process Auto-Reactions (including Groq AI sentiment)
    if (DEFAULT_SETTINGS.isAutoReactActive && matchedChannel.autoReactEnabled) {
      for (const reaction of DEFAULT_REACTION_RULES) {
        if (!reaction.enabled) continue;

        if (reaction.triggerType === 'ai_sentiment') {
          // Dynamic sentiment emojis via Groq
          const aiReact = await generateGroqEmojiReactions({
            incomingMessage: text,
            senderName,
            apiKey: groqApiKey,
            model: 'llama-3.1-8b-instant',
          });
          for (const emoji of aiReact.emojis) {
            await sendPumbleReactionApi(token, workspaceId, channelId, messageId, emoji);
            actionsPerformed.push({ reaction: emoji, rule: 'Groq AI Sentiment' });
          }
        } else if (doesMessageMatchReaction(text, reaction)) {
          for (const emoji of reaction.emojis) {
            await sendPumbleReactionApi(token, workspaceId, channelId, messageId, emoji);
            actionsPerformed.push({ reaction: emoji, rule: reaction.name });
          }
        }
      }
    }

    // 4. Process Auto-Responders (including Groq AI generation)
    if (DEFAULT_SETTINGS.isAutoResponderActive && matchedChannel.autoResponderEnabled) {
      for (const rule of DEFAULT_RESPONDER_RULES) {
        if (!rule.enabled) continue;

        if (doesMessageMatchRule(text, rule)) {
          let replyText = '';

          if (rule.responseType === 'smart_ai') {
            const aiResult = await generateGroqAutoReply({
              incomingMessage: text,
              senderName,
              channelName: matchedChannel.name,
              systemPrompt: DEFAULT_SETTINGS.groqSystemPrompt,
              ruleInstruction: rule.aiPromptInstruction,
              apiKey: groqApiKey,
              model: groqModel,
            });
            replyText = aiResult.content;
            actionsPerformed.push({
              reply: replyText,
              rule: rule.name,
              engine: 'Groq Llama 3',
              latency: aiResult.latencyMs,
            });
          } else {
            let chosen = rule.responses[0] || 'Hello!';
            if (rule.responseType === 'random' && rule.responses.length > 1) {
              chosen = rule.responses[Math.floor(Math.random() * rule.responses.length)];
            }
            replyText = formatTemplate(chosen, {
              user: senderName,
              channel: matchedChannel.name,
            });
            actionsPerformed.push({ reply: replyText, rule: rule.name, engine: 'static' });
          }

          if (replyText) {
            await sendPumbleMessageApi(token, workspaceId, channelId, replyText);
          }
          break; // Stop after primary responder rule
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: true,
      actionsCount: actionsPerformed.length,
      actions: actionsPerformed,
    });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Puble Pumble Automation Webhook Handler with Groq AI',
    timestamp: new Date().toISOString(),
  });
}
