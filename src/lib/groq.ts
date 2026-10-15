// Current active production Groq models (as of 2025/2026)
// Outdated decommissioned models (mixtral-8x7b-32768, llama3-70b-8192, llama3-8b-8192) have been removed.
export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Active Production - Best Reasoning)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Active Production - Lowest Latency)' },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision Preview (Vision & Text)' },
  { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B Preview (Lightweight & Rapid)' },
  { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B Preview (Ultra-compact)' },
];

export const FALLBACK_MODEL = 'llama-3.3-70b-versatile';
export const FALLBACK_FAST_MODEL = 'llama-3.1-8b-instant';

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionResult {
  success: boolean;
  content: string;
  latencyMs: number;
  model: string;
  tokensUsed?: number;
  error?: string;
  fellBack?: boolean;
}

/**
 * Fetch live active models directly from Groq API
 */
export async function fetchLiveGroqModels(apiKey?: string): Promise<{ id: string; name: string }[]> {
  const key = apiKey || process.env.GROQ_API_KEY || '';
  if (!key || key.startsWith('gsk_your_groq')) {
    return GROQ_MODELS;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) return GROQ_MODELS;

    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      // Filter out non-chat models (whisper, etc.) and format
      const activeChatModels = data.data
        .filter((m: any) => m.active !== false && !m.id.includes('whisper'))
        .map((m: any) => ({
          id: m.id,
          name: `${m.id} ${m.owned_by ? `(${m.owned_by})` : ''}`,
        }));

      if (activeChatModels.length > 0) return activeChatModels;
    }
    return GROQ_MODELS;
  } catch {
    return GROQ_MODELS;
  }
}

/**
 * Call Groq chat completions with automatic fallback on decommissioned models
 */
export async function callGroqChat(
  messages: GroqChatMessage[],
  apiKey?: string,
  model = FALLBACK_MODEL,
  temperature = 0.7
): Promise<GroqCompletionResult> {
  const key = apiKey || process.env.GROQ_API_KEY || '';
  const startTime = Date.now();

  // If no API key is configured yet, provide simulated intelligent response
  if (!key || key.startsWith('gsk_your_groq')) {
    const userMsg = messages[messages.length - 1]?.content || '';
    let mockReply =
      "Hello! I am PubleBot powered by Groq Llama 3.3. How can I assist you in this channel?";

    if (userMsg.toLowerCase().includes('help') || userMsg.toLowerCase().includes('support')) {
      mockReply =
        "I understand you need assistance! I've flagged this thread for our support leads. Please let us know if there are error logs or screenshots you can share.";
    } else if (userMsg.toLowerCase().includes('pricing') || userMsg.toLowerCase().includes('cost')) {
      mockReply =
        "Our enterprise pricing starts at $12/seat with custom volume discounts. Let me connect you with our accounts team right away!";
    } else if (
      userMsg.toLowerCase().includes('deploy') ||
      userMsg.toLowerCase().includes('shipped')
    ) {
      mockReply =
        "Awesome work team on the latest release! 🚀 All deployment checks are showing green.";
    }

    return {
      success: true,
      content: mockReply,
      latencyMs: 120,
      model: `${model} (Demo Simulation - Active)`,
    };
  }

  // Helper for single attempt
  const attemptCall = async (modelToUse: string): Promise<Response> => {
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature,
        max_tokens: 350,
      }),
    });
  };

  try {
    let res = await attemptCall(model);
    let usedModel = model;
    let fellBack = false;

    // Handle decommissioned or invalid model with automatic fallback to stable Llama 3.3
    if (!res.ok) {
      const errText = await res.text();
      const isDecommissioned =
        errText.includes('model_decommissioned') ||
        errText.includes('decommissioned') ||
        errText.includes('not found') ||
        res.status === 404 ||
        res.status === 400;

      if (isDecommissioned && model !== FALLBACK_MODEL) {
        console.warn(`Groq model "${model}" decommissioned. Falling back to "${FALLBACK_MODEL}".`);
        res = await attemptCall(FALLBACK_MODEL);
        usedModel = FALLBACK_MODEL;
        fellBack = true;
      } else {
        return {
          success: false,
          content: '',
          latencyMs: Date.now() - startTime,
          model: usedModel,
          error: `Groq API Error (${res.status}): ${errText}`,
        };
      }
    }

    const latencyMs = Date.now() - startTime;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    return {
      success: true,
      content,
      latencyMs,
      model: usedModel,
      tokensUsed: data.usage?.total_tokens,
      fellBack,
    };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      latencyMs: Date.now() - startTime,
      model,
      error: error?.message || 'Network error connecting to Groq API',
    };
  }
}

export async function generateGroqAutoReply(params: {
  incomingMessage: string;
  senderName: string;
  channelName: string;
  systemPrompt?: string;
  ruleInstruction?: string;
  apiKey?: string;
  model?: string;
}): Promise<GroqCompletionResult> {
  const systemInstruction =
    params.systemPrompt ||
    'You are PubleBot, an intelligent, friendly workplace assistant for the team chat. Respond directly, politely, and keep answers concise (1-3 sentences) suitable for team chat.';

  const userContent = `Channel: #${params.channelName}
User: ${params.senderName}
Message: "${params.incomingMessage}"

${params.ruleInstruction ? `Special Instruction for this reply: ${params.ruleInstruction}` : ''}
Please reply directly to ${params.senderName} in this chat:`;

  const messages: GroqChatMessage[] = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: userContent },
  ];

  return callGroqChat(messages, params.apiKey, params.model || FALLBACK_MODEL);
}

export async function generateGroqEmojiReactions(params: {
  incomingMessage: string;
  senderName: string;
  apiKey?: string;
  model?: string;
}): Promise<{ success: boolean; emojis: string[]; latencyMs: number }> {
  const prompt = `Analyze this chat message: "${params.incomingMessage}".
Choose between 1 and 3 standard emoji characters that best react to this message.
Respond ONLY with the emojis separated by space and NOTHING ELSE. Example: "🚀 🎉"`;

  const messages: GroqChatMessage[] = [
    {
      role: 'system',
      content:
        'You are an emoji reaction engine for team chat. Respond strictly with 1 to 3 emojis and no words.',
    },
    { role: 'user', content: prompt },
  ];

  const result = await callGroqChat(
    messages,
    params.apiKey,
    params.model || FALLBACK_FAST_MODEL,
    0.3
  );

  if (!result.success) {
    return { success: false, emojis: ['👍'], latencyMs: result.latencyMs };
  }

  // Extract emojis safely across all JS runtimes
  let matches: string[] | null = null;
  try {
    const emojiRegex = new RegExp(
      '[\\p{Extended_Pictographic}\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]',
      'gu'
    );
    matches = result.content.match(emojiRegex);
  } catch {
    const fallbackRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/g;
    matches = result.content.match(fallbackRegex);
  }

  return {
    success: true,
    emojis: matches && matches.length > 0 ? matches.slice(0, 3) : ['👍'],
    latencyMs: result.latencyMs,
  };
}
