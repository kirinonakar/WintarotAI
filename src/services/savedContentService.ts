import { invoke } from '../modules/tauri_api.js';
import { runtimeViewStateStore } from './runtimeViewStateStore.js';

export async function reloadNovelList() {
    try {
        const novels = await invoke<string[]>('get_saved_novels');
        const { selectedNovel } = runtimeViewStateStore.getSnapshot().savedContent;
        runtimeViewStateStore.setSavedContent({
            novelFiles: novels,
            selectedNovel: novels.includes(selectedNovel) ? selectedNovel : '',
        });
    } catch (e) {
        console.warn('[Frontend] Failed to reload history list:', e);
    }
}
