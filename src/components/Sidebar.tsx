import type { CSSProperties } from 'react';
import type {
    ApiProvider,
    ApiSettingsViewState,
    PromptEditorViewState,
    RuntimeActivityViewState,
} from '../types/app.js';
import type { ActionProps, AppProps } from './componentTypes.js';

const growStyle: CSSProperties = { flexGrow: 1 };
const hiddenGroupStyle: CSSProperties = { display: 'none' };

function ApiSettingsCard({
    actions,
    apiSettings,
}: ActionProps & { apiSettings: ApiSettingsViewState }) {
    return (
        <div className="card settings-group">
            <h2>⚙️ API SETTINGS</h2>

            <div className="input-group">
                <label htmlFor="api-provider">Provider</label>
                <select
                    id="api-provider"
                    className="inputbox"
                    value={apiSettings.provider}
                    onChange={event => actions.onProviderChange(event.currentTarget.value as ApiProvider)}
                >
                    <option value="LM Studio">LM Studio</option>
                    <option value="Google">Google</option>
                    <option value="Ollama">Ollama</option>
                    <option value="Ollama Cloud">Ollama Cloud</option>
                    <option value="OpenCode Go">OpenCode Go</option>
                    <option value="Zen">OpenCode Zen</option>
                    <option value="Cerebras">Cerebras</option>
                </select>
            </div>

            <div className="input-group">
                <label htmlFor="api-base">Endpoint URL</label>
                <input
                    id="api-base"
                    className="inputbox"
                    value={apiSettings.apiBase}
                    onChange={event => actions.onApiBaseChange(event.currentTarget.value)}
                />
            </div>

            <div className="input-group" id="group-api-key" style={apiSettings.showApiKey ? undefined : hiddenGroupStyle}>
                <label htmlFor="api-key">
                    {apiSettings.provider === 'Google'
                        ? 'Google API Key'
                        : apiSettings.provider === 'Ollama Cloud'
                            ? 'Ollama Cloud API Key'
                            : apiSettings.provider === 'Zen'
                                ? 'OpenCode Zen API Key'
                                : `${apiSettings.provider} API Key`}
                </label>
                <input
                    id="api-key"
                    type="password"
                    className="inputbox"
                    placeholder="Enter API Key"
                    value={apiSettings.apiKey}
                    onChange={event => actions.onApiKeyChange(event.currentTarget.value)}
                />
            </div>

            <div className="input-group">
                <div className="label-header">
                    <label htmlFor="model-name">Model Name</label>
                    <span id="api-status" className="status-msg">{apiSettings.apiStatus}</span>
                </div>
                <div className="auto-flex">
                    <select
                        id="model-name"
                        className="inputbox"
                        style={growStyle}
                        value={apiSettings.modelName}
                        onChange={event => actions.onModelChange(event.currentTarget.value)}
                    >
                        {apiSettings.modelOptions.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    <button
                        id="refresh-models-btn"
                        className="btn btn-icon"
                        type="button"
                        title="Refresh Models"
                        disabled={apiSettings.isRefreshingModels}
                        onClick={actions.onRefreshModels}
                    >
                        🔄
                    </button>
                </div>
            </div>
        </div>
    );
}

function TarotPromptCard({
    actions,
    promptEditor,
    isPlotRunning,
}: ActionProps & { promptEditor: PromptEditorViewState; isPlotRunning: boolean }) {
    const tarotTypes = ['한장', '세장', '관계', '선택', '말굽', '켈틱 크로스'];
    return (
        <div className="card settings-group">
            <h2>🔮 TAROT &amp; PROMPT</h2>
            
            <div className="input-group">
                <label>Tarot Type</label>
                <div className="segmented-control" style={{ flexWrap: 'wrap', gap: '4px 0' }}>
                    {tarotTypes.map(type => (
                        <button
                            key={type}
                            type="button"
                            className={`segment-btn${promptEditor.selectedPreset === type ? ' active' : ''}`}
                            style={{ flex: '1 0 30%', minWidth: '70px', padding: '6px 4px' }}
                            onClick={() => actions.onSystemPresetChange(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="input-group">
                <div className="label-header">
                    <label htmlFor="system-prompt">상담 내용</label>
                    <span className="status-msg">Ctrl+Enter로 카드 뽑기</span>
                </div>
                <textarea
                    id="system-prompt"
                    className="inputbox textarea-small"
                    rows={4}
                    spellCheck={false}
                    placeholder="상담 내용을 입력하세요"
                    value={promptEditor.systemPrompt}
                    onChange={event => actions.onSystemPromptChange(event.currentTarget.value)}
                    onKeyDown={event => {
                        if (event.key !== 'Enter' || !event.ctrlKey || event.repeat || event.nativeEvent.isComposing) return;
                        event.preventDefault();
                        if (!isPlotRunning) actions.onDrawCards();
                    }}
                    aria-keyshortcuts="Control+Enter"
                />
            </div>
        </div>
    );
}

function ReadingParamsCard({
    actions,
    activity,
}: ActionProps & {
    activity: RuntimeActivityViewState;
}) {
    return (
        <div className="card settings-group">
            <h2>🔮 RUN READING</h2>

            <div className="action-buttons-group">
                <button
                    id="btn-draw-cards"
                    className={activity.isPlotRunning ? "btn btn-danger btn-block" : "btn btn-magic btn-block pulse-hover"}
                    type="button"
                    onClick={activity.isPlotRunning ? actions.onStopGeneration : actions.onDrawCards}
                >
                    {activity.isPlotRunning ? '⏹️ 리딩 중지' : '🔮 카드 뽑기'}
                </button>
                
                <button
                    id="btn-clear-reading"
                    className="btn btn-secondary btn-block"
                    type="button"
                    disabled={activity.isPlotRunning}
                    onClick={actions.onClearReading}
                >
                    🔄 다시 뽑기
                </button>
            </div>
        </div>
    );
}

function LayoutSettingsCard({
    layout,
    setLayout,
    isInterpretationOpen,
    setIsInterpretationOpen,
    onResetLayout,
    onOpenOutputFolder,
    onViewHistory,
}: {
    layout: 'bottom' | 'right';
    setLayout: (layout: 'bottom' | 'right') => void;
    isInterpretationOpen: boolean;
    setIsInterpretationOpen: (open: boolean) => void;
    onResetLayout: () => void;
    onOpenOutputFolder: () => void;
    onViewHistory: () => void;
}) {
    return (
        <div className="card settings-group">
            <h2>🖥️ VIEW LAYOUT & ACTIONS</h2>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
                <label>해설창 위치</label>
                <div className="segmented-control" style={{ display: 'flex', width: '100%', marginBottom: '0px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' }}>
                    <button
                        type="button"
                        className={`segment-btn${layout === 'bottom' ? ' active' : ''}`}
                        onClick={() => setLayout('bottom')}
                    >
                        ⬇️ 아래쪽
                    </button>
                    <button
                        type="button"
                        className={`segment-btn${layout === 'right' ? ' active' : ''}`}
                        onClick={() => setLayout('right')}
                    >
                        ➡️ 오른쪽
                    </button>
                </div>
                <div style={{ display: 'flex', width: '100%', marginTop: '0px' }}>
                    <button
                        className="btn btn-secondary btn-block"
                        type="button"
                        onClick={onResetLayout}
                        style={{ 
                            flex: 1, 
                            marginTop: '0px', 
                            borderTopLeftRadius: '0px', 
                            borderTopRightRadius: '0px', 
                            borderBottomRightRadius: '0px',
                            borderRight: 'none',
                            fontSize: '0.75rem',
                            padding: '6px 4px'
                        }}
                    >
                        🔄 레이아웃 초기화
                    </button>
                    <button
                        className="btn btn-secondary btn-block"
                        type="button"
                        onClick={() => setIsInterpretationOpen(!isInterpretationOpen)}
                        style={{ 
                            flex: 1, 
                            marginTop: '0px', 
                            borderTopLeftRadius: '0px', 
                            borderTopRightRadius: '0px', 
                            borderBottomLeftRadius: '0px',
                            fontSize: '0.75rem',
                            padding: '6px 4px'
                        }}
                    >
                        {isInterpretationOpen ? '👁️ 해설창 닫기' : '👁️ 해설창 열기'}
                    </button>
                </div>
            </div>

            <div className="action-buttons-group">
                <button
                    className="btn btn-secondary btn-block"
                    type="button"
                    onClick={onOpenOutputFolder}
                >
                    📂 결과 폴더 열기
                </button>
                <button
                    className="btn btn-secondary btn-block"
                    type="button"
                    onClick={onViewHistory}
                >
                    ⏰ 과거 히스토리 보기
                </button>
            </div>
        </div>
    );
}

export function Sidebar({
    actions,
    viewState,
    sidebarRef,
    layout,
    setLayout,
    isInterpretationOpen,
    setIsInterpretationOpen,
    onResetLayout,
    onOpenOutputFolder,
    onViewHistory,
}: AppProps & { 
    sidebarRef?: React.Ref<HTMLElement>;
    layout: 'bottom' | 'right';
    setLayout: (layout: 'bottom' | 'right') => void;
    isInterpretationOpen: boolean;
    setIsInterpretationOpen: (open: boolean) => void;
    onResetLayout: () => void;
    onOpenOutputFolder: () => void;
    onViewHistory: () => void;
}) {
    const isDarkTheme = viewState.uiPreferences.theme === 'dark';
    const nextThemeLabel = isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode';

    return (
        <aside className="sidebar" ref={sidebarRef}>
            <div className="sidebar-header">
                <div className="brand-row">
                    <div className="brand-title-container">
                        <img src="/assets/app.png" alt="logo" className="app-logo" />
                        <h1 className="app-title">WintarotAI</h1>
                    </div>
                    <button
                        id="theme-toggle"
                        className="theme-toggle"
                        type="button"
                        data-theme={viewState.uiPreferences.theme}
                        aria-label={nextThemeLabel}
                        title={nextThemeLabel}
                        aria-pressed={isDarkTheme}
                        onClick={actions.onThemeToggle}
                    >
                        <span className="theme-toggle-icon" aria-hidden="true">{isDarkTheme ? '☀️' : '🌙'}</span>
                    </button>
                </div>
            </div>

            <ApiSettingsCard actions={actions} apiSettings={viewState.apiSettings} />
            <TarotPromptCard
                actions={actions}
                promptEditor={viewState.promptEditor}
                isPlotRunning={viewState.activity.isPlotRunning}
            />
            <ReadingParamsCard actions={actions} activity={viewState.activity} />
            <LayoutSettingsCard 
                layout={layout}
                setLayout={setLayout}
                isInterpretationOpen={isInterpretationOpen}
                setIsInterpretationOpen={setIsInterpretationOpen}
                onResetLayout={onResetLayout}
                onOpenOutputFolder={onOpenOutputFolder}
                onViewHistory={onViewHistory}
            />
        </aside>
    );
}
