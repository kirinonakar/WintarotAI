import { useState, useEffect, type CSSProperties } from 'react';
import type { AppProps } from './componentTypes.js';
import type { TarotCard } from '../types/app.js';
import { MarkdownPreview } from './MarkdownPreview.js';

type OutputAlignment = 'left' | 'center' | 'right';

const OUTPUT_ALIGNMENT_KEY = 'wintarot_output_alignment';
const outputAlignmentOptions: Array<{
    value: OutputAlignment;
    label: string;
}> = [
    { value: 'left', label: '출력창 좌측 배치' },
    { value: 'center', label: '출력창 중앙 배치' },
    { value: 'right', label: '출력창 우측 배치' },
];

function OutputAlignmentIcon({ alignment }: { alignment: OutputAlignment }) {
    const shortLineX = alignment === 'left' ? 3 : alignment === 'center' ? 6 : 9;

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M3 5h18M3 12h18M3 19h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${shortLineX} 8h12M${shortLineX} 15h12`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContainerStyle: CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '24px',
    width: '450px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
};

const modalHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
};

const historyListStyle: CSSProperties = {
    overflowY: 'auto',
    flexGrow: 1,
    marginBottom: '16px',
    maxHeight: '50vh',
};

const historyItemStyle = (selected: boolean): CSSProperties => ({
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px',
    backgroundColor: selected ? 'var(--primary-light, #f0e6ff)' : 'transparent',
    border: selected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
    transition: 'all 0.2s ease',
});

function parseTarotFilename(filename: string): string {
    // format: (novel_)?tarot_YYYYMMDDHHMMSS.txt or .json
    const match = filename.match(/^(?:novel_)?tarot_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(?:txt|json)$/);
    if (match) {
        const [_, year, month, day, hour, min, sec] = match;
        return `${year}-${month}-${day} ${hour}:${min}:${sec} 리딩 결과`;
    }
    return filename.replace('novel_', '').replace('.txt', ' 리딩').replace('.json', ' 리딩');
}

// Custom Premium SVG Fallback Card
function TarotCardImage({ card, onClick, isSelected, size }: { card: TarotCard; onClick: () => void; isSelected: boolean; size?: 'small' | 'normal' | 'large' }) {
    const [imageError, setImageError] = useState(false);

    // Get asset URL
    const imageUrl = new URL(`../assets/tarot/${card.filename}`, import.meta.url).href;

    const width = size === 'small' ? '95px' : size === 'large' ? '380px' : '135px';
    const height = size === 'small' ? '155px' : size === 'large' ? '620px' : '220px';

    const contentTransform = card.isReversed ? 'rotate(180deg)' : 'none';

    const renderSvgFallback = () => {
        // Return a beautiful celestial SVG placeholder
        let cardSymbol = "✨"; // Default
        let bgGradient = "linear-gradient(135deg, #1e1035 0%, #0c051a 100%)";

        if (card.suit === 'wands') {
            cardSymbol = "🪄";
            bgGradient = "linear-gradient(135deg, #2b1100 0%, #150900 100%)";
        } else if (card.suit === 'cups') {
            cardSymbol = "🏆";
            bgGradient = "linear-gradient(135deg, #021a2b 0%, #000c15 100%)";
        } else if (card.suit === 'swords') {
            cardSymbol = "⚔️";
            bgGradient = "linear-gradient(135deg, #1a252b 0%, #0d1215 100%)";
        } else if (card.suit === 'pentacles') {
            cardSymbol = "🪙";
            bgGradient = "linear-gradient(135deg, #1a2212 0%, #0d1109 100%)";
        } else {
            // Major Arcana special colors
            bgGradient = "linear-gradient(135deg, #2a0845 0%, #6441a5 100%)";
        }

        return (
            <div
                className="tarot-card-svg"
                style={{
                    width: '100%',
                    height: '100%',
                    background: bgGradient,
                    borderRadius: '8px',
                    border: '1.5px solid #d4af37',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: size === 'large' ? '24px 12px' : '12px 6px',
                    position: 'relative',
                    color: '#e2d5f5',
                    transform: contentTransform,
                    transition: 'transform 0.3s ease'
                }}
            >
                {/* Gold Frame decoration */}
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    right: '4px',
                    bottom: '4px',
                    border: '0.5px solid rgba(212, 175, 55, 0.4)',
                    pointerEvents: 'none',
                    borderRadius: '6px'
                }} />

                {/* Card Number */}
                <div style={{ fontSize: size === 'large' ? '1.5rem' : '0.75rem', fontWeight: 600, color: '#d4af37', letterSpacing: '1px' }}>
                    {card.type === 'major' ? card.value : card.value}
                </div>

                {/* Central Icon */}
                <div style={{ fontSize: size === 'large' ? '4.5rem' : '2rem', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }}>
                    {cardSymbol}
                </div>

                {/* Card Names */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: size === 'large' ? '1.4rem' : '0.7rem', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                        {card.koreanName}
                    </span>
                    <span style={{ fontSize: size === 'large' ? '1rem' : '0.55rem', color: '#a690cd', letterSpacing: '0.5px', textAlign: 'center' }}>
                        {card.name}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`tarot-card-container${isSelected ? ' selected' : ''}`}
            onClick={onClick}
            style={{ position: 'relative', width, height, cursor: 'pointer', marginTop: '12px', marginBottom: '12px' }}
        >
            {imageError ? (
                renderSvgFallback()
            ) : (
                <img
                    src={imageUrl}
                    alt={card.name}
                    className="tarot-card-img"
                    onError={() => setImageError(true)}
                    style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', transform: contentTransform, transition: 'transform 0.3s ease' }}
                />
            )}
            {isSelected && (
                <div className="card-selected-badge">
                    <span>★</span>
                </div>
            )}
        </div>
    );
}

function extractAdvice(text: string): { body: string; advice: string | null } {
    if (!text) return { body: '', advice: null };

    // Match line starting with "조언:" or "* 조언:" or "Advice:"
    const adviceRegex = /(?:\r?\n|^)(?:\*\s*)?(?:조언|Advice)\s*:\s*(.*)(?:\r?\n|$)/i;
    const match = text.match(adviceRegex);
    if (match) {
        const adviceText = match[1].trim();
        const bodyText = text.replace(adviceRegex, '\n').trim();
        return { body: bodyText, advice: adviceText };
    }
    return { body: text, advice: null };
}

export function TarotReadingSection({
    actions,
    viewState,
    layout,
    cardsHeight,
    setCardsHeight,
    cardsWidth,
    setCardsWidth,
    isInterpretationOpen,
    dragPosition,
    setDragPosition,
    historyOpen,
    setHistoryOpen,
}: AppProps & {
    layout: 'bottom' | 'right';
    cardsHeight: number | null;
    setCardsHeight: (h: number | null) => void;
    cardsWidth: number | null;
    setCardsWidth: (w: number | null) => void;
    isInterpretationOpen: boolean;
    dragPosition: { x: number; y: number };
    setDragPosition: (pos: { x: number; y: number }) => void;
    historyOpen: boolean;
    setHistoryOpen: (open: boolean) => void;
}) {
    const [selectedHistoryFile, setSelectedHistoryFile] = useState('');
    const [outputAlignment, setOutputAlignment] = useState<OutputAlignment>(() => {
        const savedAlignment = localStorage.getItem(OUTPUT_ALIGNMENT_KEY);
        return savedAlignment === 'left' || savedAlignment === 'right' ? savedAlignment : 'center';
    });
    const { drawnCards, selectedCardIndex, plot, plotStatus } = viewState.editor;

    const selectedCard: TarotCard | undefined =
        selectedCardIndex !== null ? drawnCards[selectedCardIndex] : undefined;

    const [isResizing, setIsResizing] = useState(false);

    // Draggable card details panel state
    const [isDraggingCardDetail, setIsDraggingCardDetail] = useState(false);
    const [dragCardDetailStart, setDragCardDetailStart] = useState({ x: 0, y: 0 });
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!selectedCard) {
            setIsZoomed(false);
        }
    }, [selectedCard]);


    const handleCardDetailMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
            return;
        }
        setIsDraggingCardDetail(true);
        setDragCardDetailStart({
            x: e.clientX - dragPosition.x,
            y: e.clientY - dragPosition.y
        });
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDraggingCardDetail) return;

        const handleMouseMove = (e: MouseEvent) => {
            setDragPosition({
                x: e.clientX - dragCardDetailStart.x,
                y: e.clientY - dragCardDetailStart.y
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDraggingCardDetail(false);
            const finalPos = {
                x: e.clientX - dragCardDetailStart.x,
                y: e.clientY - dragCardDetailStart.y
            };
            setDragPosition(finalPos);
            localStorage.setItem('wintarot_popup_position', JSON.stringify(finalPos));
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingCardDetail, dragCardDetailStart, setDragPosition]);

    const handleSplitterMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsResizing(true);
        document.body.style.cursor = layout === 'bottom' ? 'row-resize' : 'col-resize';
        document.body.classList.add('is-resizing');
        e.preventDefault();
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = document.getElementById('reading-section-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();

            if (layout === 'bottom') {
                const newHeight = e.clientY - rect.top;
                const boundedHeight = Math.max(150, Math.min(newHeight, rect.height - 150));
                setCardsHeight(boundedHeight);
                localStorage.setItem('wintarot_cards_height', String(boundedHeight));
            } else {
                const newWidth = e.clientX - rect.left;
                const boundedWidth = Math.max(300, Math.min(newWidth, rect.width - 250));
                setCardsWidth(boundedWidth);
                localStorage.setItem('wintarot_cards_width', String(boundedWidth));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
            document.body.classList.remove('is-resizing');
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, layout]);

    const handleHistoryItemClick = (file: string) => {
        setSelectedHistoryFile(file);
        actions.onSavedNovelChange(file); // sync to state store
    };

    const handleLoadReading = () => {
        if (selectedHistoryFile) {
            actions.onLoadTarotReading();
            setHistoryOpen(false);
        }
    };

    const handleOutputAlignmentChange = (alignment: OutputAlignment) => {
        setOutputAlignment(alignment);
        localStorage.setItem(OUTPUT_ALIGNMENT_KEY, alignment);
    };

    const { body, advice } = extractAdvice(plot);
    const tarotType = viewState.promptEditor.selectedPreset; // '한장' | '세장' | '관계' | '선택' | '말굽' | '켈틱 크로스'
    const isCelticCross = tarotType === '켈틱 크로스' && drawnCards.length === 10;
    const isRelationship = tarotType === '관계' && drawnCards.length === 5;
    const isChoice = tarotType === '선택' && drawnCards.length === 5;
    const isHorseshoe = tarotType === '말굽' && drawnCards.length === 7;

    const renderCelticCross = () => {
        const c0 = drawnCards[0];
        const c1 = drawnCards[1];
        const c2 = drawnCards[2];
        const c3 = drawnCards[3];
        const c4 = drawnCards[4];
        const c5 = drawnCards[5];
        const c6 = drawnCards[6];
        const c7 = drawnCards[7];
        const c8 = drawnCards[8];
        const c9 = drawnCards[9];

        return (
            <div className="celtic-cross-layout" style={{
                display: 'flex',
                gap: '24px',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px 12px 12px 12px',
                flex: '1',
                minWidth: '580px',
                overflowX: 'auto',
                flexWrap: 'nowrap'
            }}>
                {/* 1. Left Cross (3x3 Grid) */}
                <div className="celtic-cross-grid" style={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(3, 185px)',
                    gridTemplateColumns: 'repeat(3, 115px)',
                    gap: '16px 8px',
                    alignItems: 'center',
                    justifyItems: 'center',
                    position: 'relative',
                    paddingTop: '16px'
                }}>
                    {/* Row 1, Col 2: Card 2 (의식적 목표) */}
                    <div style={{ gridRow: '1', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {c2 && <TarotCardImage card={c2} size="small" isSelected={selectedCardIndex === 2} onClick={() => actions.onSelectCard(2)} />}
                        <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{c2?.positionLabel}</span>
                    </div>

                    {/* Row 2, Col 1: Card 4 (과거의 원인) */}
                    <div style={{ gridRow: '2', gridColumn: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {c4 && <TarotCardImage card={c4} size="small" isSelected={selectedCardIndex === 4} onClick={() => actions.onSelectCard(4)} />}
                        <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{c4?.positionLabel}</span>
                    </div>

                    {/* Row 2, Col 2: Center Stack (Card 0 & Card 1) */}
                    <div style={{ gridRow: '2', gridColumn: '2', position: 'relative', width: '95px', height: '155px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Card 0 (현재 상황) - under */}
                        <div style={{ position: 'absolute', zIndex: 1 }}>
                            <TarotCardImage card={c0} size="small" isSelected={selectedCardIndex === 0} onClick={() => actions.onSelectCard(0)} />
                        </div>
                        {/* Card 1 (장애물) - crossed horizontally on top */}
                        {c1 && (
                            <div style={{
                                position: 'absolute',
                                zIndex: 2,
                                transform: 'rotate(90deg)',
                                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))'
                            }}>
                                <TarotCardImage card={c1} size="small" isSelected={selectedCardIndex === 1} onClick={() => actions.onSelectCard(1)} />
                            </div>
                        )}
                        {/* Label overlays for both */}
                        <div style={{ position: 'absolute', bottom: '-26px', display: 'flex', gap: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <span style={{ color: selectedCardIndex === 0 ? 'var(--primary-color)' : 'var(--text-dark)' }}>{c0.positionLabel}</span>/
                            <span style={{ color: selectedCardIndex === 1 ? 'var(--primary-color)' : 'var(--text-dark)' }}>{c1?.positionLabel}</span>
                        </div>
                    </div>

                    {/* Row 2, Col 3: Card 5 (가까운 미래) */}
                    <div style={{ gridRow: '2', gridColumn: '3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {c5 && <TarotCardImage card={c5} size="small" isSelected={selectedCardIndex === 5} onClick={() => actions.onSelectCard(5)} />}
                        <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{c5?.positionLabel}</span>
                    </div>

                    {/* Row 3, Col 2: Card 3 (잠재의식) */}
                    <div style={{ gridRow: '3', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px' }}>
                        {c3 && <TarotCardImage card={c3} size="small" isSelected={selectedCardIndex === 3} onClick={() => actions.onSelectCard(3)} />}
                        <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{c3?.positionLabel}</span>
                    </div>
                </div>

                {/* 2. Right Pillar (4x1 Column) */}
                <div className="celtic-cross-pillar" style={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: '10px',
                    alignItems: 'center',
                    borderLeft: '1.5px dashed var(--border-color)',
                    paddingLeft: '24px',
                    paddingTop: '16px'
                }}>
                    {[c6, c7, c8, c9].map((card, index) => {
                        if (!card) return null;
                        const cardIdx = 6 + index;
                        return (
                            <div key={card.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: 'auto', minWidth: '220px' }}>
                                <TarotCardImage card={card} size="small" isSelected={selectedCardIndex === cardIdx} onClick={() => actions.onSelectCard(cardIdx)} />
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <span className="card-position-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{card.positionLabel}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderRelationship = () => {
        const c0 = drawnCards[0]; // 나
        const c1 = drawnCards[1]; // 상대방
        const c2 = drawnCards[2]; // 과거
        const c3 = drawnCards[3]; // 현재
        const c4 = drawnCards[4]; // 미래

        return (
            <div className="relationship-layout" style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 185px)',
                gridTemplateColumns: 'repeat(3, 115px)',
                gap: '16px 12px',
                alignItems: 'center',
                justifyItems: 'center',
                padding: '24px 12px 12px 12px',
                flex: '1',
                minWidth: '360px',
                overflowX: 'auto',
                margin: '0 auto',
                width: 'fit-content'
            }}>
                {/* Col 1, Row 2: 나 */}
                <div style={{ gridRow: '2', gridColumn: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c0 && <TarotCardImage card={c0} size="small" isSelected={selectedCardIndex === 0} onClick={() => actions.onSelectCard(0)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c0?.positionLabel}</span>
                </div>

                {/* Col 3, Row 2: 상대방 */}
                <div style={{ gridRow: '2', gridColumn: '3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c1 && <TarotCardImage card={c1} size="small" isSelected={selectedCardIndex === 1} onClick={() => actions.onSelectCard(1)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c1?.positionLabel}</span>
                </div>

                {/* Col 2, Row 1: 과거 */}
                <div style={{ gridRow: '1', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c2 && <TarotCardImage card={c2} size="small" isSelected={selectedCardIndex === 2} onClick={() => actions.onSelectCard(2)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c2?.positionLabel}</span>
                </div>

                {/* Col 2, Row 2: 현재 */}
                <div style={{ gridRow: '2', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c3 && <TarotCardImage card={c3} size="small" isSelected={selectedCardIndex === 3} onClick={() => actions.onSelectCard(3)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c3?.positionLabel}</span>
                </div>

                {/* Col 2, Row 3: 미래 */}
                <div style={{ gridRow: '3', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c4 && <TarotCardImage card={c4} size="small" isSelected={selectedCardIndex === 4} onClick={() => actions.onSelectCard(4)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c4?.positionLabel}</span>
                </div>
            </div>
        );
    };

    const renderChoice = () => {
        const c0 = drawnCards[0]; // 현재 상황
        const c1 = drawnCards[1]; // 가까운 미래 (A)
        const c2 = drawnCards[2]; // 결과 (A)
        const c3 = drawnCards[3]; // 가까운 미래 (B)
        const c4 = drawnCards[4]; // 결과 (B)

        return (
            <div className="choice-layout" style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 185px) auto',
                gridTemplateColumns: 'repeat(5, 115px)',
                gap: '16px 12px',
                alignItems: 'center',
                justifyItems: 'center',
                padding: '24px 12px 12px 12px',
                flex: '1',
                minWidth: '580px',
                overflowX: 'auto',
                margin: '0 auto',
                width: 'fit-content'
            }}>
                {/* Col 3, Row 3: 현재 상황 (1) */}
                <div style={{ gridRow: '3', gridColumn: '3', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c0 && <TarotCardImage card={c0} size="small" isSelected={selectedCardIndex === 0} onClick={() => actions.onSelectCard(0)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c0?.positionLabel}</span>
                </div>

                {/* Col 2, Row 2: 선택지 A 가까운 미래 (2) */}
                <div style={{ gridRow: '2', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c1 && <TarotCardImage card={c1} size="small" isSelected={selectedCardIndex === 1} onClick={() => actions.onSelectCard(1)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c1?.positionLabel}</span>
                </div>

                {/* Col 1, Row 1: 선택지 A 결과 (3) */}
                <div style={{ gridRow: '1', gridColumn: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c2 && <TarotCardImage card={c2} size="small" isSelected={selectedCardIndex === 2} onClick={() => actions.onSelectCard(2)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c2?.positionLabel}</span>
                </div>

                {/* Col 4, Row 2: 선택지 B 가까운 미래 (4) */}
                <div style={{ gridRow: '2', gridColumn: '4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c3 && <TarotCardImage card={c3} size="small" isSelected={selectedCardIndex === 3} onClick={() => actions.onSelectCard(3)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c3?.positionLabel}</span>
                </div>

                {/* Col 5, Row 1: 선택지 B 결과 (5) */}
                <div style={{ gridRow: '1', gridColumn: '5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c4 && <TarotCardImage card={c4} size="small" isSelected={selectedCardIndex === 4} onClick={() => actions.onSelectCard(4)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c4?.positionLabel}</span>
                </div>

                {/* Row 4, Col 1-2: 선택지 A 설명 */}
                <div style={{
                    gridRow: '4',
                    gridColumn: '1 / span 2',
                    textAlign: 'center',
                    padding: '12px 6px',
                    borderTop: '1px dashed var(--border-color)',
                    marginTop: '8px',
                    width: '100%'
                }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '4px' }}>선택지 A</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        A를 선택했을 때<br />벌어질 가능성이 높은 시나리오<br />(1-2-3)
                    </div>
                </div>

                {/* Row 4, Col 4-5: 선택지 B 설명 */}
                <div style={{
                    gridRow: '4',
                    gridColumn: '4 / span 2',
                    textAlign: 'center',
                    padding: '12px 6px',
                    borderTop: '1px dashed var(--border-color)',
                    marginTop: '8px',
                    width: '100%'
                }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '4px' }}>선택지 B</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        B를 선택했을 때<br />벌어질 가능성이 높은 시나리오<br />(1-4-5)
                    </div>
                </div>
            </div>
        );
    };

    const renderHorseshoe = () => {
        const c0 = drawnCards[0]; // 가장 중요한 변수
        const c1 = drawnCards[1]; // 가까운 미래
        const c2 = drawnCards[2]; // 외부의 영향
        const c3 = drawnCards[3]; // 현재 상황
        const c4 = drawnCards[4]; // 희망/두려움
        const c5 = drawnCards[5]; // 최근의 과거
        const c6 = drawnCards[6]; // 예상되는 결과

        return (
            <div className="horseshoe-layout" style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 210px)',
                gridTemplateColumns: 'repeat(5, 115px)',
                gap: '16px 12px',
                alignItems: 'center',
                justifyItems: 'center',
                padding: '24px 12px 12px 12px',
                flex: '1',
                minWidth: '580px',
                overflowX: 'auto',
                margin: '0 auto',
                width: 'fit-content'
            }}>
                {/* Col 3, Row 3: 가장 중요한 변수 (1) */}
                <div style={{ gridRow: '3', gridColumn: '3', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '22px' }}>
                    {c0 && <TarotCardImage card={c0} size="small" isSelected={selectedCardIndex === 0} onClick={() => actions.onSelectCard(0)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c0?.positionLabel}</span>
                </div>

                {/* Col 2, Row 3: 가까운 미래 (2) */}
                <div style={{ gridRow: '3', gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c1 && <TarotCardImage card={c1} size="small" isSelected={selectedCardIndex === 1} onClick={() => actions.onSelectCard(1)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c1?.positionLabel}</span>
                </div>

                {/* Col 4, Row 3: 외부의 영향 (3) */}
                <div style={{ gridRow: '3', gridColumn: '4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c2 && <TarotCardImage card={c2} size="small" isSelected={selectedCardIndex === 2} onClick={() => actions.onSelectCard(2)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c2?.positionLabel}</span>
                </div>

                {/* Col 1, Row 2: 현재 상황 (4) */}
                <div style={{ gridRow: '2', gridColumn: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c3 && <TarotCardImage card={c3} size="small" isSelected={selectedCardIndex === 3} onClick={() => actions.onSelectCard(3)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c3?.positionLabel}</span>
                </div>

                {/* Col 5, Row 2: 희망/두려움 (5) */}
                <div style={{ gridRow: '2', gridColumn: '5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c4 && <TarotCardImage card={c4} size="small" isSelected={selectedCardIndex === 4} onClick={() => actions.onSelectCard(4)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c4?.positionLabel}</span>
                </div>

                {/* Col 1, Row 1: 최근의 과거 (6) */}
                <div style={{ gridRow: '1', gridColumn: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c5 && <TarotCardImage card={c5} size="small" isSelected={selectedCardIndex === 5} onClick={() => actions.onSelectCard(5)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c5?.positionLabel}</span>
                </div>

                {/* Col 5, Row 1: 예상되는 결과 (7) */}
                <div style={{ gridRow: '1', gridColumn: '5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {c6 && <TarotCardImage card={c6} size="small" isSelected={selectedCardIndex === 6} onClick={() => actions.onSelectCard(6)} />}
                    <span className="card-position-label" style={{ fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>{c6?.positionLabel}</span>
                </div>
            </div>
        );
    };

    return (
        <section
            id="reading-section-container"
            className="card content-section flex-grow"
            style={{
                display: 'flex',
                flexDirection: layout === 'bottom' ? 'column' : 'row',
                gap: '0px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >

            {/* Draw Cards Block */}
            <div
                className="drawn-cards-block"
                style={
                    !isInterpretationOpen
                        ? { flexGrow: 1, height: '100%', width: '100%', overflowY: 'auto', paddingBottom: '16px' }
                        : layout === 'bottom'
                            ? { height: cardsHeight !== null ? `${cardsHeight}px` : '50%', overflowY: 'auto', flexShrink: 0, paddingBottom: '16px' }
                            : { width: cardsWidth !== null ? `${cardsWidth}px` : '50%', overflowY: 'auto', flexShrink: 0, paddingRight: '16px', display: 'flex', flexDirection: 'column' }
                }
            >
                <div className="section-header-title" style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔮</span>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>뽑은 카드</h2>
                </div>

                {drawnCards.length === 0 ? (
                    <div className="empty-cards-state">
                        <div className="mystic-orb-glow">🔮</div>
                        <p>상담 내용을 입력하고 왼쪽에 있는 <strong>'카드 뽑기'</strong> 버튼을 누르면 타로 리딩이 시작됩니다.</p>
                    </div>
                ) : (
                    <div className="cards-display-row-wrapper" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', paddingTop: '20px' }}>

                        {/* Cards Layout container */}
                        {isCelticCross ? (
                            renderCelticCross()
                        ) : isRelationship ? (
                            renderRelationship()
                        ) : isChoice ? (
                            renderChoice()
                        ) : isHorseshoe ? (
                            renderHorseshoe()
                        ) : (
                            <div className="cards-list-row" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '16px 8px 12px 8px', flex: '1', minWidth: '300px' }}>
                                {drawnCards.map((card, idx) => (
                                    <div key={card.id} className="card-item-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <TarotCardImage
                                            card={card}
                                            isSelected={selectedCardIndex === idx}
                                            onClick={() => actions.onSelectCard(idx)}
                                        />
                                        <span className="card-position-label">{card.positionLabel}</span>
                                        <span className="card-sub-meaning" style={{ fontSize: '0.75rem', fontWeight: 500, color: card.isReversed ? 'var(--danger-color, #ef4444)' : 'var(--text-muted)' }}>
                                            {card.isReversed ? '역방향' : '정방향'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Card Popup/Panel */}
                        {selectedCard && (
                            <div
                                className="card-detail-popup-panel"
                                style={{
                                    width: '320px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    background: 'var(--sidebar-bg)',
                                    position: 'absolute',
                                    right: '24px',
                                    top: '80px',
                                    zIndex: 100,
                                    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
                                    boxShadow: 'var(--modal-shadow)',
                                    userSelect: isDraggingCardDetail ? 'none' : 'auto'
                                }}
                            >
                                {/* Draggable Header handle */}
                                <div
                                    className="detail-drag-handle"
                                    onMouseDown={handleCardDetailMouseDown}
                                    style={{
                                        cursor: 'move',
                                        padding: '6px 8px',
                                        margin: '-16px -16px 12px -16px',
                                        background: 'var(--surface-subtle)',
                                        borderTopLeftRadius: '12px',
                                        borderTopRightRadius: '12px',
                                        borderBottom: '1px solid var(--border-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>📍 드래그하여 이동 가능</span>
                                    <button className="close-btn" type="button" onClick={() => actions.onSelectCard(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}>✕</button>
                                </div>

                                <div className="detail-card-visual-row" style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'center' }}>
                                    <div
                                        style={{ width: '85px', height: '140px', flexShrink: 0, cursor: 'zoom-in' }}
                                        onClick={() => setIsZoomed(true)}
                                        title="클릭하여 확대"
                                    >
                                        <TarotCardImage card={selectedCard} size="small" isSelected={false} onClick={() => setIsZoomed(true)} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: 'var(--primary-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {selectedCard.koreanName}
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: selectedCard.isReversed ? 'var(--danger-color, #ef4444)' : 'var(--primary-color)',
                                                color: '#fff',
                                                fontWeight: 600,
                                                width: 'fit-content'
                                            }}>
                                                {selectedCard.isReversed ? '역방향' : '정방향'}
                                            </span>
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCard.name}</span>
                                    </div>
                                </div>

                                <div className="meaning-block" style={{ marginBottom: '16px' }}>
                                    <div className="meaning-title" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>
                                        <span>🌟</span> 기본 의미
                                    </div>
                                    <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                        {selectedCard.basicMeanings.map((m, i) => (
                                            <li key={i} style={{ marginBottom: '4px' }}>{m}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="meaning-block">
                                    <div className="meaning-title" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>
                                        <span>💜</span> 현재 상황에서의 의미
                                    </div>
                                    <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                        {(selectedCard.isReversed && selectedCard.reversedMeanings
                                            ? selectedCard.reversedMeanings
                                            : selectedCard.currentMeanings
                                        ).map((m, i) => (
                                            <li key={i} style={{ marginBottom: '4px' }}>{m}</li>
                                        ))}
                                    </ul>
                                </div>

                                {selectedCard.symbols && selectedCard.symbols.length > 0 && (
                                    <div className="meaning-block" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                        <div className="meaning-title" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>
                                            <span>🎨</span> 카드 속 주요 상징
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {selectedCard.symbols.map((sym, i) => (
                                                <span
                                                    key={i}
                                                    title={sym.meaning}
                                                    style={{
                                                        fontSize: '0.72rem',
                                                        color: 'var(--primary-color)',
                                                        background: 'var(--primary-light, #f0e6ff)',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        cursor: 'help',
                                                        fontWeight: 500,
                                                        border: '1px solid var(--border-color)'
                                                    }}
                                                >
                                                    {sym.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Splitter Divider */}
            {isInterpretationOpen && (
                <div
                    className={`splitter ${isResizing ? 'dragging' : ''}`}
                    onMouseDown={handleSplitterMouseDown}
                    style={{
                        backgroundColor: 'var(--border-color)',
                        transition: 'background-color 0.2s',
                        flexShrink: 0,
                        zIndex: 10,
                        ...(layout === 'bottom'
                            ? { height: '8px', cursor: 'row-resize', width: '100%', margin: '4px 0' }
                            : { width: '8px', cursor: 'col-resize', height: '100%', margin: '0 4px' }
                        )
                    }}
                />
            )}

            {/* Comprehensive Interpretation Section */}
            {isInterpretationOpen && (
                <div
                    className="interpretation-section flex-grow"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minWidth: layout === 'right' ? '250px' : 'none',
                        minHeight: layout === 'bottom' ? '150px' : 'none',
                        ...(layout === 'right' ? { paddingLeft: '16px', overflowY: 'auto' } : { paddingTop: '16px' })
                    }}
                >
                    <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <div className="section-header-title" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔮</span>
                            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>종합적인 해설</h2>
                        </div>
                        <div className="output-alignment-control" role="group" aria-label="해설 출력창 배치">
                            {outputAlignmentOptions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`output-alignment-button${outputAlignment === value ? ' active' : ''}`}
                                    aria-label={label}
                                    title={label}
                                    aria-pressed={outputAlignment === value}
                                    onClick={() => handleOutputAlignmentChange(value)}
                                >
                                    <OutputAlignmentIcon alignment={value} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Bar */}
                    {plotStatus.state !== 'idle' && (
                        <div className="status-bar" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span>상태:</span>
                            <span id="plot-status-msg" className={`status-text ${plotStatus.state}`}>{plotStatus.message}</span>
                        </div>
                    )}

                    {/* Markdown Preview Content */}
                    <div className="interpretation-body-wrapper" style={{ flexGrow: 1, minHeight: '150px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {body.trim() === '' ? (
                            <div className="empty-interpretation-state" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '24px 0' }}>
                                {plotStatus.state === 'generating' ? '해설이 작성되는 중입니다...' : '아직 생성된 타로 해설이 없습니다. 왼쪽의 카드 뽑기를 시작해보세요.'}
                            </div>
                        ) : (
                            <div className="markdown-preview-container" style={{ flexGrow: 1, overflowY: 'auto' }}>
                                <MarkdownPreview
                                    id="plot-content-preview"
                                    className={`markdown-body inputbox textarea-plot output-align-${outputAlignment}`}
                                    content={body}
                                    style={{ height: '100%', minHeight: '100%' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Advice Box Banner */}
                    {advice && (
                        <div className="advice-banner-box" style={{ padding: '16px', background: 'var(--primary-light, #f6f0ff)', borderRadius: '10px', borderLeft: '4px solid var(--primary-color, #7f55e0)', display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '12px' }}>
                            <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>✨</span>
                            <div style={{ fontSize: '0.9rem', color: 'var(--primary-dark, #4b2d99)', fontWeight: 500 }}>
                                <strong>조언:</strong> {advice} 💜
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* History Modal Overlay */}
            {historyOpen && (
                <div className="modal-overlay" style={modalOverlayStyle} onClick={() => setHistoryOpen(false)}>
                    <div className="modal-container" style={modalContainerStyle} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>⏰ 과거 리딩 히스토리</h3>
                            <button onClick={() => setHistoryOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
                        </div>

                        <div className="history-list" style={historyListStyle}>
                            {viewState.savedContent.novelFiles.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>저장된 과거 리딩 기록이 없습니다.</p>
                            ) : (
                                viewState.savedContent.novelFiles.map(file => (
                                    <div
                                        key={file}
                                        style={historyItemStyle(selectedHistoryFile === file)}
                                        onClick={() => handleHistoryItemClick(file)}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>⏰</span> {parseTarotFilename(file)}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.85 }}>
                                            <span>📄</span> {file}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setHistoryOpen(false)}>닫기</button>
                            <button
                                className="btn btn-primary"
                                disabled={!selectedHistoryFile}
                                onClick={handleLoadReading}
                            >
                                불러오기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enlarged Card Zoom Overlay */}
            {isZoomed && selectedCard && (
                <div
                    className="card-zoom-overlay"
                    onClick={() => setIsZoomed(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 2000,
                        cursor: 'zoom-out',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            gap: '32px',
                            maxWidth: '900px',
                            width: '90%',
                            maxHeight: '90vh',
                            padding: '24px',
                            background: 'rgba(20, 10, 35, 0.9)',
                            borderRadius: '20px',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                            cursor: 'default',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Column: Enlarged Card Image */}
                        <div style={{
                            width: '380px',
                            height: '620px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                            border: '2px solid #d4af37',
                            backgroundColor: '#0c051a',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <TarotCardImage card={selectedCard} isSelected={false} size="large" onClick={() => { }} />
                        </div>

                        {/* Right Column: Description & Metadata */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            color: '#e2d5f5',
                            overflowY: 'auto',
                            paddingRight: '8px',
                        }}>
                            {/* Header */}
                            <div style={{
                                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                                paddingBottom: '16px',
                                marginBottom: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800, color: '#d4af37', letterSpacing: '0.5px' }}>
                                        {selectedCard.koreanName}
                                    </h2>
                                    <span style={{ fontSize: '1rem', color: '#a690cd' }}>{selectedCard.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: selectedCard.isReversed ? 'var(--danger-color, #ef4444)' : 'var(--primary-color, #7f55e0)',
                                        color: '#fff',
                                        fontWeight: 600
                                    }}>
                                        {selectedCard.isReversed ? '역방향' : '정방향'}
                                    </span>
                                    {selectedCard.positionLabel && (
                                        <span style={{
                                            fontSize: '0.8rem',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: 'rgba(212, 175, 55, 0.15)',
                                            border: '1px solid rgba(212, 175, 55, 0.3)',
                                            color: '#d4af37',
                                            fontWeight: 600
                                        }}>
                                            {selectedCard.positionLabel}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Meaning Summary */}
                            {selectedCard.meaningSummary && (
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6',
                                    color: '#f0eaff',
                                    marginBottom: '24px',
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>🔮</span>
                                    <div>{selectedCard.meaningSummary}</div>
                                </div>
                            )}

                            {/* Basic Meanings */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>
                                    <span>🌟</span> 기본 의미
                                </h4>
                                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.95rem', color: '#c4b5e0', lineHeight: '1.6' }}>
                                    {selectedCard.basicMeanings.map((m, i) => (
                                        <li key={i} style={{ marginBottom: '6px' }}>{m}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Meaning in Situation */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>
                                    <span>💜</span> 현재 상황에서의 의미 ({selectedCard.isReversed ? '역방향' : '정방향'})
                                </h4>
                                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.95rem', color: '#c4b5e0', lineHeight: '1.6' }}>
                                    {(selectedCard.isReversed && selectedCard.reversedMeanings
                                        ? selectedCard.reversedMeanings
                                        : selectedCard.currentMeanings
                                    ).map((m, i) => (
                                        <li key={i} style={{ marginBottom: '6px' }}>{m}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Symbols Details */}
                            {selectedCard.symbols && selectedCard.symbols.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>
                                        <span>🎨</span> 카드 속 상징 해설
                                    </h4>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                    }}>
                                        {selectedCard.symbols.map((sym, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: '#d4af37',
                                                    background: 'rgba(212, 175, 55, 0.15)',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap',
                                                    marginTop: '2px',
                                                    border: '1px solid rgba(212, 175, 55, 0.3)'
                                                }}>
                                                    {sym.name}
                                                </span>
                                                <span style={{ fontSize: '0.95rem', color: '#c4b5e0', lineHeight: '1.6' }}>
                                                    {sym.meaning}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer / Close Button */}
                            <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setIsZoomed(false)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        color: '#fff',
                                        padding: '10px 28px',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                        border: '1px solid rgba(255, 255, 255, 0.15)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)' }}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
