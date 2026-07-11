import type { GenerationStatus, TarotCard } from '../types/app.js';
import { runtimeViewStateStore } from './runtimeViewStateStore.js';

export function getEditorSnapshot() {
    return runtimeViewStateStore.getSnapshot().editor;
}

export function setPlotText(plot: string) {
    runtimeViewStateStore.setEditor({ plot });
}

export function setDrawnCards(drawnCards: TarotCard[]) {
    runtimeViewStateStore.setEditor({ drawnCards });
}

export function setSelectedCardIndex(selectedCardIndex: number | null) {
    runtimeViewStateStore.setEditor({ selectedCardIndex });
}

export function setPlotStatus(message: string, state: GenerationStatus = 'idle') {
    runtimeViewStateStore.setEditor({
        plotStatus: { message, state },
    });
}
