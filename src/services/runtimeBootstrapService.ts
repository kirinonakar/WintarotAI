import { showToast } from '../modules/toast.js';
import type { AppSettingsController } from './appSettingsUiService.js';
import { initializeNovelgenRuntime } from './runtimeInitializationService.js';
import { reloadNovelList } from './savedContentService.js';

interface RuntimeBootstrapOptions {
    appSettings: AppSettingsController;
}

export function createRuntimeBootstrap({
    appSettings,
}: RuntimeBootstrapOptions) {
    let didInitialize = false;

    return async function initialize() {
        if (didInitialize) return;
        didInitialize = true;

        try {
            await initializeNovelgenRuntime({
                setProviderUI: appSettings.setProviderUI,
                refreshModels: appSettings.refreshModels,
                reloadNovelList,
            });
        } catch (error) {
            console.error('[Frontend] React runtime initialization failed:', error);
            showToast('Runtime initialization failed: ' + error, 'error');
        }
    };
}
