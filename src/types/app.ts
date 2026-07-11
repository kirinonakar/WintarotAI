export type ApiProvider = 'LM Studio' | 'Google' | 'Ollama' | 'Ollama Cloud' | 'OpenCode Go' | 'Zen' | 'Cerebras';
export type Language = 'Korean' | 'Japanese' | 'English';
export type ThemeMode = 'light' | 'dark';

export type GenerationStatus =
    | 'idle'
    | 'generating'
    | 'refining'
    | 'saving'
    | 'loading'
    | 'stopping'
    | 'completed'
    | 'cancelled'
    | 'error';

export interface TarotCardSymbol {
    name: string;
    meaning: string;
}

export interface TarotCard {
    id: number;
    name: string;
    koreanName: string;
    type: 'major' | 'minor';
    suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
    value: number;
    filename: string;
    meaningSummary: string;
    basicMeanings: string[];
    currentMeanings: string[];
    reversedMeanings?: string[];
    positionLabel?: string;
    isReversed?: boolean;
    symbols?: TarotCardSymbol[];
}

export interface ApiSettingsSnapshot {
    provider: ApiProvider;
    apiBase: string;
    modelName: string;
}

export interface SavedAppSettings {
    provider: ApiProvider | null;
    apiBase: string | null;
    model: string | null;
    lmStudioBase: string | null;
    lmStudioModel: string | null;
    googleModel: string | null;
    ollamaBase: string | null;
    ollamaModel: string | null;
    ollamaCloudBase: string | null;
    ollamaCloudModel: string | null;
    opencodeGoBase: string | null;
    opencodeGoModel: string | null;
    zenBase: string | null;
    zenModel: string | null;
    cerebrasBase: string | null;
    cerebrasModel: string | null;
}

export interface ApiSettingsViewState {
    provider: ApiProvider;
    apiBase: string;
    apiKey: string;
    showApiKey: boolean;
    modelName: string;
    modelOptions: string[];
    apiStatus: string;
    isRefreshingModels: boolean;
}

export interface GenerationParamsViewState {
    language: Language;
    detail: string; // '보통' | '상세'
    temperature: string;
    topP: string;
    repetitionPenalty: string;
}

export interface UiPreferencesViewState {
    theme: ThemeMode;
}

export interface RuntimeActivityViewState {
    isPlotRunning: boolean; // representing tarot generation running
    isRefreshingModels: boolean;
}

export interface PromptEditorViewState {
    presetOptions: string[];
    selectedPreset: string; // tarot type: '한장' | '세장' | '켈틱 크로스'
    systemPrompt: string;  // consultation details: 상담 내용
    promptStatus: string;
}

export interface SavedContentViewState {
    novelFiles: string[]; // history of saved tarot readings
    selectedNovel: string;
}

export interface EditorViewState {
    plot: string; // comprehensive analysis text: 종합적인 해설
    drawnCards: TarotCard[];
    selectedCardIndex: number | null;
    plotStatus: { state: GenerationStatus; message: string }; // status message
}

export interface RuntimeViewState {
    apiSettings: ApiSettingsViewState;
    activity: RuntimeActivityViewState;
    editor: EditorViewState;
    generationParams: GenerationParamsViewState;
    promptEditor: PromptEditorViewState;
    savedContent: SavedContentViewState;
    uiPreferences: UiPreferencesViewState;
}

export interface NovelgenRuntimeActions {
    onProviderChange: (provider: ApiProvider) => void;
    onThemeToggle: () => void;
    onRefreshModels: () => void;
    onApiBaseChange: (apiBase: string) => void;
    onApiKeyChange: (apiKey: string) => void;
    onModelChange: (modelName: string) => void;
    onSystemPresetChange: (presetName: string) => void; // repurposed for tarot type change
    onSystemPromptChange: (systemPrompt: string) => void; // repurposed for consultation detail change
    
    // Tarot actions
    onDrawCards: () => void;
    onSelectCard: (index: number | null) => void;
    onSaveTarotReading: () => void;
    onLoadTarotReading: () => void;
    onSavedNovelChange: (filename: string) => void;
    onRefreshNovels: () => void;
    onClearReading: () => void;
    onStopGeneration: () => void;
    onOpenOutputFolder: () => void;
}
