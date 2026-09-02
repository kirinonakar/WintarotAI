import type { ApiProvider, ApiSettingsSnapshot, SavedAppSettings } from '../types/app.js';

export const DEFAULT_LM_STUDIO_BASE = 'http://localhost:1234/v1';
export const DEFAULT_LM_STUDIO_MODEL = 'unsloth/gemma-4-31b-it';
export const DEFAULT_GOOGLE_MODEL = 'gemini-flash-lite-latest';
const DEFAULT_OLLAMA_BASE = 'http://localhost:11434/v1';
const DEFAULT_OLLAMA_CLOUD_BASE = 'https://ollama.com/v1';
export const DEFAULT_OPENCODE_GO_BASE = 'https://opencode.ai/zen/go/v1';
export const DEFAULT_ZEN_BASE = 'https://opencode.ai/zen/v1';
export const DEFAULT_CEREBRAS_BASE = 'https://api.cerebras.ai/v1';
export const DEFAULT_UNSLOTH_BASE = 'http://localhost:8888/v1';
export const DEFAULT_UNSLOTH_MODEL = 'default';

export const GOOGLE_MODELS = [
    DEFAULT_GOOGLE_MODEL,
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemma-4-26b-a4b-it',
    'gemma-4-31b-it'
];

export const OPENCODE_GO_MODELS = [
    'glm-5.2',
    'glm-5.1',
    'kimi-k2.7-code',
    'kimi-k2.6',
    'mimo-v2.5',
    'mimo-v2.5-pro',
    'minimax-m3',
    'minimax-m2.7',
    'qwen3.7-max',
    'qwen3.7-plus',
    'qwen3.6-plus',
    'deepseek-v4-pro',
    'deepseek-v4-flash',
];

// These models are available on OpenCode Zen without an API key and use the
// OpenAI-compatible Chat Completions endpoint used by the Rust client.
export const ZEN_FREE_MODELS = [
    'mimo-v2.5-free',
    'big-pickle',
    'ling-3.0-flash-fin-free',
    'nemotron-3-ultra-free',
    'nemotron-3.5-lightning-free',
];

export const ZEN_MODELS = [
    ...ZEN_FREE_MODELS,
    'glm-5.2',
    'glm-5.1',
    'kimi-k2.7-code',
    'kimi-k2.6',
    'mimo-v2.5',
    'mimo-v2.5-pro',
    'minimax-m3',
    'minimax-m2.7',
    'qwen3.7-max',
    'qwen3.7-plus',
    'qwen3.6-plus',
    'deepseek-v4-pro',
    'deepseek-v4-flash',
];

export const CEREBRAS_MODELS = [
    'gemma-4-31b',
    'gpt-oss-120b',
    'zai-glm-4.7',
];

function asApiProvider(value: string | null | undefined): ApiProvider | null {
    const providers: ApiProvider[] = ['LM Studio', 'Google', 'Ollama', 'Ollama Cloud', 'OpenCode Go', 'Zen', 'Cerebras', 'Unsloth Desktop'];
    return providers.find(p => p === value) || null;
}

export function readSavedAppSettings(): SavedAppSettings {
    return {
        provider: asApiProvider(localStorage.getItem('api-provider')),
        apiBase: localStorage.getItem('api-base'),
        model: localStorage.getItem('api-model'),
        lmStudioBase: localStorage.getItem('api-base-lmstudio'),
        lmStudioModel: localStorage.getItem('api-model-lmstudio'),
        googleModel: localStorage.getItem('api-model-google'),
        ollamaBase: localStorage.getItem('api-base-ollama'),
        ollamaModel: localStorage.getItem('api-model-ollama'),
        ollamaCloudBase: localStorage.getItem('api-base-ollamacloud'),
        ollamaCloudModel: localStorage.getItem('api-model-ollamacloud'),
        opencodeGoBase: localStorage.getItem('api-base-opencodego'),
        opencodeGoModel: localStorage.getItem('api-model-opencodego'),
        zenBase: localStorage.getItem('api-base-zen'),
        zenModel: localStorage.getItem('api-model-zen'),
        cerebrasBase: localStorage.getItem('api-base-cerebras'),
        cerebrasModel: localStorage.getItem('api-model-cerebras'),
        unslothBase: localStorage.getItem('api-base-unsloth'),
        unslothModel: localStorage.getItem('api-model-unsloth'),
        thinkingLevel: asThinkingLevel(localStorage.getItem('api-thinking-level')),
    };
}

export function saveApiSettings(settings: ApiSettingsSnapshot) {
    localStorage.setItem('api-provider', settings.provider);
    localStorage.setItem('api-base', settings.apiBase);
    localStorage.setItem('api-model', settings.modelName);
    localStorage.setItem('api-thinking-level', settings.thinkingLevel);

    if (settings.provider === 'LM Studio') {
        localStorage.setItem('api-base-lmstudio', settings.apiBase);
        localStorage.setItem('api-model-lmstudio', settings.modelName);
    } else if (settings.provider === 'Google') {
        localStorage.setItem('api-model-google', settings.modelName);
    } else if (settings.provider === 'Ollama') {
        localStorage.setItem('api-base-ollama', settings.apiBase);
        localStorage.setItem('api-model-ollama', settings.modelName);
    } else if (settings.provider === 'Ollama Cloud') {
        localStorage.setItem('api-base-ollamacloud', settings.apiBase);
        localStorage.setItem('api-model-ollamacloud', settings.modelName);
    } else if (settings.provider === 'OpenCode Go') {
        localStorage.setItem('api-base-opencodego', settings.apiBase);
        localStorage.setItem('api-model-opencodego', settings.modelName);
    } else if (settings.provider === 'Zen') {
        localStorage.setItem('api-base-zen', settings.apiBase);
        localStorage.setItem('api-model-zen', settings.modelName);
    } else if (settings.provider === 'Cerebras') {
        localStorage.setItem('api-base-cerebras', settings.apiBase);
        localStorage.setItem('api-model-cerebras', settings.modelName);
    } else if (settings.provider === 'Unsloth Desktop') {
        localStorage.setItem('api-base-unsloth', settings.apiBase);
        localStorage.setItem('api-model-unsloth', settings.modelName);
    }
}

export function getProviderBase(provider: ApiProvider, saved: SavedAppSettings): string {
    if (provider === 'Google') {
        return 'https://generativelanguage.googleapis.com/v1beta/openai/';
    }
    if (provider === 'Ollama') {
        return saved.ollamaBase || DEFAULT_OLLAMA_BASE;
    }
    if (provider === 'Ollama Cloud') {
        return saved.ollamaCloudBase || DEFAULT_OLLAMA_CLOUD_BASE;
    }
    if (provider === 'OpenCode Go') {
        return saved.opencodeGoBase || DEFAULT_OPENCODE_GO_BASE;
    }
    if (provider === 'Zen') {
        return saved.zenBase || DEFAULT_ZEN_BASE;
    }
    if (provider === 'Cerebras') {
        return saved.cerebrasBase || DEFAULT_CEREBRAS_BASE;
    }
    if (provider === 'Unsloth Desktop') {
        return saved.unslothBase || DEFAULT_UNSLOTH_BASE;
    }
    return saved.lmStudioBase || DEFAULT_LM_STUDIO_BASE;
}

export function getProviderModel(provider: ApiProvider, saved: SavedAppSettings): string {
    if (provider === 'Google') {
        return saved.googleModel || DEFAULT_GOOGLE_MODEL;
    }
    if (provider === 'Ollama') {
        return saved.ollamaModel || '';
    }
    if (provider === 'Ollama Cloud') {
        return saved.ollamaCloudModel || '';
    }
    if (provider === 'OpenCode Go') {
        return saved.opencodeGoModel || '';
    }
    if (provider === 'Zen') {
        return saved.zenModel || '';
    }
    if (provider === 'Cerebras') {
        return saved.cerebrasModel || '';
    }
    if (provider === 'Unsloth Desktop') {
        return saved.unslothModel || DEFAULT_UNSLOTH_MODEL;
    }
    return saved.lmStudioModel || '';
}

function asThinkingLevel(value: string | null): SavedAppSettings['thinkingLevel'] {
    const levels: SavedAppSettings['thinkingLevel'][] = ['default', 'disable', 'low', 'medium', 'high', 'xhigh', 'max'];
    return levels.includes(value as SavedAppSettings['thinkingLevel'])
        ? value as SavedAppSettings['thinkingLevel']
        : 'default';
}
