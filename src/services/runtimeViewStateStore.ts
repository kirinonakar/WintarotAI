import type {
    ApiSettingsViewState,
    EditorViewState,
    GenerationParamsViewState,
    PromptEditorViewState,
    RuntimeActivityViewState,
    RuntimeViewState,
    SavedContentViewState,
    UiPreferencesViewState,
} from '../types/app.js';
import {
    DEFAULT_LM_STUDIO_BASE,
    DEFAULT_LM_STUDIO_MODEL,
} from './settingsService.js';

export const DEFAULT_LM_STUDIO_MODEL_OPTIONS = [
    DEFAULT_LM_STUDIO_MODEL,
    'unsloth/gemma-4-26b-a4b-it',
    'qwen/qwen3.5-35b-a3b',
    'qwen3.5-27b',
];

const initialApiSettings: ApiSettingsViewState = {
    provider: 'LM Studio',
    apiBase: DEFAULT_LM_STUDIO_BASE,
    apiKey: '',
    showApiKey: false,
    modelName: DEFAULT_LM_STUDIO_MODEL,
    modelOptions: DEFAULT_LM_STUDIO_MODEL_OPTIONS,
    apiStatus: '',
    isRefreshingModels: false,
};

const initialGenerationParams: GenerationParamsViewState = {
    language: 'Korean',
    detail: '상세',
    temperature: '1.0',
    topP: '0.95',
    repetitionPenalty: '1.1',
};

const initialUiPreferences: UiPreferencesViewState = {
    theme: 'light',
};

const initialActivity: RuntimeActivityViewState = {
    isPlotRunning: false,
    isRefreshingModels: false,
};

const initialPromptEditor: PromptEditorViewState = {
    presetOptions: ['한장', '세장', '관계', '선택', '말굽', '켈틱 크로스'],
    selectedPreset: '한장',
    systemPrompt: '',
    promptStatus: '',
};

const initialSavedContent: SavedContentViewState = {
    novelFiles: [],
    selectedNovel: '',
};

const initialEditor: EditorViewState = {
    plot: '',
    drawnCards: [],
    selectedCardIndex: null,
    plotStatus: { state: 'idle', message: 'Idle' },
};

let state: RuntimeViewState = {
    apiSettings: initialApiSettings,
    activity: initialActivity,
    editor: initialEditor,
    generationParams: initialGenerationParams,
    promptEditor: initialPromptEditor,
    savedContent: initialSavedContent,
    uiPreferences: initialUiPreferences,
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach(listener => listener());
}

export const runtimeViewStateStore = {
    getSnapshot() {
        return state;
    },

    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    setApiSettings(update: Partial<ApiSettingsViewState>) {
        state = {
            ...state,
            apiSettings: {
                ...state.apiSettings,
                ...update,
            },
        };
        emit();
    },

    setActivity(update: Partial<RuntimeActivityViewState>) {
        state = {
            ...state,
            activity: {
                ...state.activity,
                ...update,
            },
        };
        emit();
    },

    setGenerationParams(update: Partial<GenerationParamsViewState>) {
        state = {
            ...state,
            generationParams: {
                ...state.generationParams,
                ...update,
            },
        };
        emit();
    },

    setEditor(update: Partial<EditorViewState>) {
        state = {
            ...state,
            editor: {
                ...state.editor,
                ...update,
            },
        };
        emit();
    },

    setPromptEditor(update: Partial<PromptEditorViewState>) {
        state = {
            ...state,
            promptEditor: {
                ...state.promptEditor,
                ...update,
            },
        };
        emit();
    },

    setSavedContent(update: Partial<SavedContentViewState>) {
        state = {
            ...state,
            savedContent: {
                ...state.savedContent,
                ...update,
            },
        };
        emit();
    },

    setUiPreferences(update: Partial<UiPreferencesViewState>) {
        state = {
            ...state,
            uiPreferences: {
                ...state.uiPreferences,
                ...update,
            },
        };
        emit();
    },

};
