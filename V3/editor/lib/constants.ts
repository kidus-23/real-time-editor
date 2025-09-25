export const AI_MODELS = {
  GEMINI: {
    'gemini-2.5-flash': {
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      type: 'chat'
    },
    'gemini-2.5-flash-lite': {
      name: 'Gemini 2.5 Flash Lite',
      provider: 'google',
      type: 'chat'
    }
  },
  OPENAI: {
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      type: 'chat'
    },
    'o3-mini': {
      name: 'OpenAI o3-Mini',
      provider: 'openai',
      type: 'chat'
    },
    'o4-mini': {
      name: 'OpenAI o4-Mini',
      provider: 'openai',
      type: 'chat'
    }
  }
} as const;

export type ModelId = keyof typeof AI_MODELS.GEMINI | keyof typeof AI_MODELS.OPENAI;
