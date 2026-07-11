import { eventHasFiles } from '../modules/text_utils.js';

export function installGlobalFileDropGuards() {
    const listeners: Array<[string, (event: Event) => void]> = [];

    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        const listener = (event: Event) => {
            if (!eventHasFiles(event as DragEvent)) return;
            event.preventDefault();
        };
        listeners.push([eventName, listener]);
        document.addEventListener(eventName, listener);
    });

    return () => {
        listeners.forEach(([eventName, listener]) => {
            document.removeEventListener(eventName, listener);
        });
    };
}
