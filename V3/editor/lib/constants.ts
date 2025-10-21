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
    },
    'openai/gpt-oss-20b:free': {
      name: 'GPT OSS 20B',
      provider: 'openai',
      type: 'chat'
    },
    'mistralai/mistral-small-3.2-24b-instruct:free': {
      name: 'Mistral Small 24B',
      provider: 'openai',
      type: 'chat'
    },
    'qwen/qwen3-235b-a22b:free': {
      name: 'Qwen3 Coder',
      provider: 'openai',
      type: 'chat'
    },
    'deepseek/deepseek-r1:free': {
      name: 'DeepSeek Chat R1',
      provider: 'openai',
      type: 'chat'
    },
    'meta-llama/llama-3.2-3b-instruct:free': {
      name: 'Llama 3.2 3B Instruct',
      provider: 'openai',
      type: 'chat'
    }
  }
} as const;

export type ModelId = keyof typeof AI_MODELS.GEMINI | keyof typeof AI_MODELS.OPENAI;
