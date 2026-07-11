import { marked } from 'marked';
import { initTauriApi } from '../modules/tauri_api.js';
import { showToast } from '../modules/toast.js';

function installRuntimeErrorHandler() {
    window.onerror = function (msg, url, lineNo, columnNo) {
        const errorMsg = `Error: ${msg}\nLine: ${lineNo}\nColumn: ${columnNo}\nURL: ${url}`;
        console.error(errorMsg);
        showToast('NovelGen Runtime Error', 'error');
        return false;
    };
}

function configureMarkdownRenderer() {
    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const renderer = new marked.Renderer();
    renderer.html = ({ text }) => escapeHtml(text);

    marked.use({
        breaks: true,
        gfm: true,
        renderer,
    });

    window.marked = marked as unknown as Window['marked'];
}

export function initializeRuntimeServices() {
    console.log('[Frontend] React runtime starting...');
    installRuntimeErrorHandler();
    configureMarkdownRenderer();
    initTauriApi(showToast);
}
