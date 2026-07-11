import { useEffect, useRef, useState } from 'react';
import { useGlobalFileDropGuards } from '../hooks/useGlobalFileDropGuards.js';
import { installSidebarResizer } from '../services/sidebarResizerService.js';
import type { AppProps } from './componentTypes.js';
import { TarotReadingSection } from './TarotReadingSection.js';
import { Sidebar } from './Sidebar.js';
import { ToastContainer } from './ToastContainer.js';

export function NovelgenApp({ actions, viewState }: AppProps) {
    const sidebarRef = useRef<HTMLElement | null>(null);
    const resizerRef = useRef<HTMLDivElement | null>(null);

    useGlobalFileDropGuards();

    const [layout, setLayout] = useState<'bottom' | 'right'>(() => {
        return (localStorage.getItem('wintarot_layout') as 'bottom' | 'right') || 'right';
    });
    const [cardsHeight, setCardsHeight] = useState<number | null>(() => {
        const saved = localStorage.getItem('wintarot_cards_height');
        return saved ? Number(saved) : null;
    });
    const [cardsWidth, setCardsWidth] = useState<number | null>(() => {
        const saved = localStorage.getItem('wintarot_cards_width');
        return saved ? Number(saved) : null;
    });
    const [isInterpretationOpen, setIsInterpretationOpen] = useState<boolean>(() => {
        const stored = localStorage.getItem('wintarot_interpretation_open');
        return stored !== 'false';
    });
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>(() => {
        const saved = localStorage.getItem('wintarot_popup_position');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse popup position:', e);
            }
        }
        return { x: 0, y: 0 };
    });
    const [historyOpen, setHistoryOpen] = useState(false);

    const handleResetLayout = () => {
        setLayout('right');
        setCardsHeight(null);
        setCardsWidth(null);
        setIsInterpretationOpen(true);
        setDragPosition({ x: 0, y: 0 });
        localStorage.removeItem('wintarot_layout');
        localStorage.removeItem('wintarot_cards_height');
        localStorage.removeItem('wintarot_cards_width');
        localStorage.removeItem('wintarot_interpretation_open');
        localStorage.removeItem('wintarot_popup_position');
    };

    useEffect(() => {
        if (!sidebarRef.current || !resizerRef.current) return;
        return installSidebarResizer({
            resizer: resizerRef.current,
            sidebar: sidebarRef.current,
        });
    }, []);

    return (
        <>
            <ToastContainer />
            <div className="app-container">
                <Sidebar 
                    actions={actions} 
                    sidebarRef={sidebarRef} 
                    viewState={viewState}
                    layout={layout}
                    setLayout={(l) => {
                        setLayout(l);
                        localStorage.setItem('wintarot_layout', l);
                    }}
                    isInterpretationOpen={isInterpretationOpen}
                    setIsInterpretationOpen={(o) => {
                        setIsInterpretationOpen(o);
                        localStorage.setItem('wintarot_interpretation_open', String(o));
                    }}
                    onResetLayout={handleResetLayout}
                    onOpenOutputFolder={() => actions.onOpenOutputFolder()}
                    onViewHistory={() => {
                        void actions.onRefreshNovels();
                        setHistoryOpen(true);
                    }}
                />
                <div className="resizer" id="sidebar-resizer" ref={resizerRef} />
                <main className="main-content">
                    <TarotReadingSection 
                        actions={actions} 
                        viewState={viewState}
                        layout={layout}
                        cardsHeight={cardsHeight}
                        setCardsHeight={setCardsHeight}
                        cardsWidth={cardsWidth}
                        setCardsWidth={setCardsWidth}
                        isInterpretationOpen={isInterpretationOpen}
                        dragPosition={dragPosition}
                        setDragPosition={setDragPosition}
                        historyOpen={historyOpen}
                        setHistoryOpen={setHistoryOpen}
                    />
                </main>
            </div>
        </>
    );
}
