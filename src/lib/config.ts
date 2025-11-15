export const config = {
  ai: {
    systemPrompt:
      "You are a helpful AI assistant. Provide clear, accurate, and concise responses. " +
      "If you're unsure about something, acknowledge it. Be respectful and professional. " +
      "Always respond in the same language that the user is using.",

    titleGeneration: {
      temperature: 0.7,
      maxTokens: 30,
      model: "openai/gpt-4o-mini",
      prompt: `Generate a short, concise title for a conversation based on the user's first message. The title should be 3-4 words maximum and capture the main topic or intent. Respond ONLY with the title text, without quotes or additional formatting. Use the same language as the user's message.

Examples:
USER: 'How do I bake chocolate chip cookies?'
AI: Chocolate Chip Cookies

USER: 'Explain quantum computing in simple terms'
AI: Quantum Computing Basics

USER: 'Write a Python function to sort a list'
AI: Python List Sorting

USER: 'Co to jest sztuczna inteligencja?'
AI: Sztuczna Inteligencja

USER: 'Quels sont les meilleurs restaurants à Paris?'
AI: Restaurants à Paris

Now generate a title for the following message:`,
    },

    conversationSummary: {
      temperature: 0.5,
      maxTokens: 500,
      model: "openai/gpt-4o-mini",
      prompt: `You are a helpful assistant that creates concise summaries of conversations. Your task is to summarize the conversation history provided below.

Guidelines:
- Create a clear, informative summary that captures the key points and context
- Maintain the same language as the conversation
- Focus on main topics, important decisions, and key information discussed
- Keep the summary concise but comprehensive (2-4 paragraphs maximum)
- Use third-person perspective (e.g., "The user asked about..." "The assistant explained...")
- Structure the summary logically, grouping related topics together

Your summary will be used to provide context for continuing the conversation in a new branch, so include all essential information that would help understand what was previously discussed.

Now summarize the following conversation:`,
    },

    openRouter: {
      baseUrl: "https://openrouter.ai/api/v1",
      timeoutMs: 60000,
    },

    parameters: {
      temperature: {
        min: 0.0,
        max: 2.0,
        default: 1.0,
      },
      maxTokens: {
        min: 1,
        max: 32768,
        default: 4096,
      },
      topP: {
        min: 0.0,
        max: 1.0,
        default: 1.0,
      },
      frequencyPenalty: {
        min: -2.0,
        max: 2.0,
        default: 0.0,
      },
      presencePenalty: {
        min: -2.0,
        max: 2.0,
        default: 0.0,
      },
      maxHistoryMessages: 50,
      maxPromptLength: 100000,
    },
  },

  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100,
  },

  crypto: {
    algorithm: "aes-256-gcm" as const,
    saltLength: 16,
    ivLength: 16,
    authTagLength: 16,
    keyLength: 32,
  },
} as const;
