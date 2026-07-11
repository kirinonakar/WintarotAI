import type { NovelgenRuntimeActions } from '../types/app.js';
import { createAppSettingsController } from './appSettingsUiService.js';
import { createRuntimeBootstrap } from './runtimeBootstrapService.js';
import { reloadNovelList } from './savedContentService.js';
import { getSelectedProvider } from './runtimeSelectorsService.js';
import { createRuntimeWorkflowActions } from './runtimeWorkflowActionsService.js';

interface NovelgenRuntimeController {
    actions: NovelgenRuntimeActions;
    initialize: () => Promise<void>;
}

const getProvider = getSelectedProvider;

export function createNovelgenRuntimeController(): NovelgenRuntimeController {
    const appSettings = createAppSettingsController({ getProvider });
    
    const workflowActions = createRuntimeWorkflowActions({
        getProvider,
        reloadNovelList,
    });
    
    const actions: NovelgenRuntimeActions = {
        onProviderChange: (provider) => {
            appSettings.updateProvider(provider);
            void appSettings.setProviderUI();
        },
        onThemeToggle: workflowActions.onThemeToggle,
        onRefreshModels: () => void appSettings.refreshModels(),
        onApiBaseChange: (apiBase) => {
            appSettings.updateApiBase(apiBase);
            void appSettings.refreshModels();
            void appSettings.saveSettings();
        },
        onApiKeyChange: (apiKey) => {
            appSettings.updateApiKey(apiKey);
            void appSettings.persistGoogleApiKey().then(() => appSettings.saveSettings());
        },
        onModelChange: (modelName) => {
            appSettings.updateModelName(modelName);
            void appSettings.saveSettings();
        },
        onSystemPresetChange: workflowActions.onSystemPresetChange,
        onSystemPromptChange: workflowActions.onSystemPromptChange,
        onDrawCards: workflowActions.onDrawCards,
        onSelectCard: workflowActions.onSelectCard,
        onSaveTarotReading: workflowActions.onSaveTarotReading,
        onLoadTarotReading: workflowActions.onLoadTarotReading,
        onSavedNovelChange: workflowActions.onSavedNovelChange,
        onRefreshNovels: workflowActions.onRefreshNovels,
        onClearReading: workflowActions.onClearReading,
        onStopGeneration: workflowActions.onStopGeneration,
        onOpenOutputFolder: workflowActions.onOpenOutputFolder,
    };
    
    const initialize = createRuntimeBootstrap({ appSettings });
    
    return {
        actions,
        initialize,
    };
}
