import { invoke } from '../modules/tauri_api.js';
import { showToast } from '../modules/toast.js';
import { runtimeSessionState } from './runtimeSessionStateService.js';
import {
    generatePlotStream,
    type PlotStreamEvent,
} from './plotGenerationService.js';
import {
    getEditorSnapshot,
    setPlotStatus,
    setPlotText,
    setDrawnCards,
    setSelectedCardIndex,
} from './runtimeEditorStateService.js';
import { runtimeViewStateStore } from './runtimeViewStateStore.js';
import { TAROT_CARDS, type TarotCard } from './tarotData.js';
import type {
    ApiProvider,
    NovelgenRuntimeActions,
} from '../types/app.js';
import { toggleTheme } from '../modules/ui_preferences.js';

interface RuntimeWorkflowActionOptions {
    getProvider: () => ApiProvider;
    reloadNovelList: () => Promise<void>;
}

type RuntimeWorkflowActions = Pick<
    NovelgenRuntimeActions,
    | 'onThemeToggle'
    | 'onSystemPresetChange'
    | 'onSystemPromptChange'
    | 'onDrawCards'
    | 'onSelectCard'
    | 'onSaveTarotReading'
    | 'onLoadTarotReading'
    | 'onSavedNovelChange'
    | 'onRefreshNovels'
    | 'onClearReading'
    | 'onStopGeneration'
    | 'onOpenOutputFolder'
>;

function drawUniqueCards(count: number): TarotCard[] {
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(card => ({
        ...card,
        isReversed: Math.random() < 0.5
    }));
}

function appendPlotStreamHint(message: string) {
    if (message.includes('401')) {
        return `${message}\n\n💡 [Hint] Unauthorized. Check your API key.`;
    }
    if (message.includes('403')) {
        return `${message}\n\n💡 [Hint] Forbidden. Safety filters or permissions might have blocked it.`;
    }
    if (message.includes('429')) {
        return `${message}\n\n💡 [Hint] Quota exceeded. Please wait a moment or check billing.`;
    }
    return message;
}

export function createRuntimeWorkflowActions(options: RuntimeWorkflowActionOptions): RuntimeWorkflowActions {
    function requireApiKey() {
        const provider = options.getProvider();
        const { apiKey } = runtimeViewStateStore.getSnapshot().apiSettings;
        const apiKeyProviders: ApiProvider[] = ['Google', 'Ollama Cloud', 'OpenCode Go', 'Zen', 'Cerebras'];
        if (!apiKeyProviders.includes(provider) || apiKey.trim()) return false;
        showToast(`Please enter a ${provider} API Key in the sidebar.`, 'warning');
        return true;
    }

    async function drawCards() {
        const stateSnapshot = runtimeViewStateStore.getSnapshot();
        const tarotType = stateSnapshot.promptEditor.selectedPreset; // '한장' | '세장' | '켈틱 크로스'
        const consultation = stateSnapshot.promptEditor.systemPrompt; // 상담 내용
        const lang = stateSnapshot.generationParams.language;
        const detail = stateSnapshot.generationParams.detail; // 보통 | 상세

        let cardCount = 1;
        if (tarotType === '세장') cardCount = 3;
        else if (tarotType === '관계' || tarotType === '선택') cardCount = 5;
        else if (tarotType === '말굽') cardCount = 7;
        else if (tarotType === '켈틱 크로스') cardCount = 10;

        const drawn = drawUniqueCards(cardCount);

        const positionLabels =
            tarotType === '세장'
                ? ["과거", "현재", "미래"]
                : tarotType === '관계'
                    ? ["나", "상대방", "과거", "현재", "미래"]
                    : tarotType === '선택'
                        ? ["현재 상황", "가까운 미래 (A)", "결과 (A)", "가까운 미래 (B)", "결과 (B)"]
                        : tarotType === '말굽'
                            ? ["가장 중요한 변수", "가까운 미래", "외부의 영향", "현재 상황", "희망/두려움", "최근의 과거", "예상되는 결과"]
                            : tarotType === '켈틱 크로스'
                                ? [
                                      "현재 상황",
                                      "장애물",
                                      "의식적 목표",
                                      "잠재의식",
                                      "과거의 원인",
                                      "가까운 미래",
                                      "본인의 태도",
                                      "주변 환경",
                                      "희망과 공포",
                                      "최종 결과",
                                  ]
                                : ["오늘의 흐름"];

        const updatedDrawn = drawn.map((card, idx) => ({
            ...card,
            positionLabel: positionLabels[idx] || "",
        }));

        setDrawnCards(updatedDrawn);
        setSelectedCardIndex(0); // Auto-select the first card
        setPlotText('');

        if (requireApiKey()) return;

        const cardDescriptions = updatedDrawn
            .map(
                (card, idx) => {
                    const direction = card.isReversed ? '역방향 (Reversed)' : '정방향 (Upright)';
                    return `[위치: ${card.positionLabel}] 카드 ${idx + 1}: ${card.koreanName} (${card.name}) - ${direction} - 기본 의미: ${card.basicMeanings.join(', ')}`;
                }
            )
            .join('\n');

        const systemPrompt = `You are a professional, intuitive Tarot card reader. Interpret the drawn cards in relation to the client's consultation details. Provide a comprehensive, detailed, and deeply insightful analysis in ${lang}. Focus on how the meanings of the cards combine and flow together, blending their symbolism with the client's situation. Conclude with a clear, actionable advice at the end. Use rich markdown formatting. Make it feel mystical and deeply personal.`;

        const userPrompt = `상담 내용: ${consultation || '일반적인 운세'}
타로 스프레드 방식: ${tarotType}
상세도: ${detail}

뽑힌 카드 목록:
${cardDescriptions}

질문자의 상황에 맞춰 각 카드가 놓인 위치의 의미와 카드 자체의 상징을 융합하여 깊이 있는 종합적인 해설(Interpretation)을 제공해 주시고, 마지막에 질문자를 위한 조언(Advice)을 2~3문장으로 정리하여 💜 이모지와 함께 마무리해 주세요.`;

        runtimeSessionState.stopRequested = false;
        runtimeViewStateStore.setActivity({ isPlotRunning: true });
        setPlotStatus('⏳ 해설을 작성하고 있습니다...', 'generating');

        try {
            const { apiBase, apiKey, modelName } = stateSnapshot.apiSettings;
            const temperature = parseFloat(stateSnapshot.generationParams.temperature);
            const topP = parseFloat(stateSnapshot.generationParams.topP);
            const repetitionPenalty = parseFloat(stateSnapshot.generationParams.repetitionPenalty);

            await generatePlotStream(
                {
                    apiBase,
                    modelName,
                    apiKey: apiKey || 'lm-studio',
                    systemPrompt,
                    prompt: userPrompt,
                    temperature,
                    topP,
                    repetitionPenalty,
                    maxTokens: 8192,
                },
                (event: PlotStreamEvent) => {
                    if (runtimeSessionState.stopRequested && !event.is_finished && !event.error) return;

                    if (event.content) {
                        setPlotText(event.content);
                    }

                    if (event.error) {
                        const msg = appendPlotStreamHint(event.error);
                        setPlotText(`${event.content || ''}\n\n[Error]: ${msg}`);
                        setPlotStatus('❌ 오류 발생', 'error');
                    }

                    if (event.is_finished && !event.error) {
                        const message = runtimeSessionState.stopRequested ? '🛑 중단됨' : '✅ 해설 완료';
                        setPlotStatus(message, runtimeSessionState.stopRequested ? 'cancelled' : 'completed');
                        if (!runtimeSessionState.stopRequested) {
                            void autoSaveTarotReadingToHistory(event.content);
                        }
                    }
                },
            );
        } catch (e) {
            const currentText = getEditorSnapshot().plot;
            setPlotText(`${currentText}\n[Error]: ${e}`);
            setPlotStatus('❌ 오류 발생', 'error');
        } finally {
            runtimeViewStateStore.setActivity({ isPlotRunning: false });
        }
    }

    async function autoSaveTarotReadingToHistory(content: string) {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const date = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const dateStr = `${year}${month}${date}${hours}${minutes}${seconds}`;
            const filename = `tarot_${dateStr}.txt`;

            const editor = getEditorSnapshot();
            const promptEditor = runtimeViewStateStore.getSnapshot().promptEditor;
            const generationParams = runtimeViewStateStore.getSnapshot().generationParams;

            const metadataJson = JSON.stringify({
                drawnCards: editor.drawnCards,
                selectedPreset: promptEditor.selectedPreset,
                systemPrompt: promptEditor.systemPrompt,
                language: generationParams.language,
                detail: generationParams.detail,
                date: now.toLocaleString(),
            });

            await invoke('save_novel_state', {
                filename,
                textContent: content,
                metadataJson,
            });

            void options.reloadNovelList();
        } catch (e) {
            console.error('[History] Failed to auto-save tarot reading:', e);
        }
    }

    function compileTxtContent(editor: any, promptEditor: any, date: string): string {
        const cardLines = editor.drawnCards.map((card: any, idx: number) => 
            `[위치: ${card.positionLabel || (idx + 1)}] ${card.koreanName} (${card.name}) - ${card.meaningSummary}`
        ).join('\n');

        return `🔮 WintarotAI 타로 리딩 결과 🔮
==================================================
■ 상담 일시: ${date}
■ 상담 내용: ${promptEditor.systemPrompt || '일반적인 운세'}
■ 스프레드: ${promptEditor.selectedPreset}
==================================================

■ 뽑힌 카드:
${cardLines}

==================================================
■ 종합적인 해설:
${editor.plot}

==================================================
감사합니다. 당신의 미래에 행운이 깃들기를 바랍니다. 💜
`;
    }

    async function saveTarotReading() {
        const editor = getEditorSnapshot();
        if (!editor.plot.trim() && editor.drawnCards.length === 0) {
            showToast('저장할 타로 점 결과가 없습니다.', 'warning');
            return;
        }

        try {
            const promptEditor = runtimeViewStateStore.getSnapshot().promptEditor;
            const now = new Date();
            const dateStr = now.toLocaleString();
            
            const txtContent = compileTxtContent(editor, promptEditor, dateStr);
            
            // Browser Blob download to trigger native save dialog
            const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const date = String(now.getDate()).padStart(2, '0');
            const fileDateStr = `${year}${month}${date}`;
            a.href = url;
            a.download = `wintarot_reading_${fileDateStr}.txt`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            showToast('타로 리딩 결과 파일(TXT) 다운로드가 시작되었습니다.', 'success');
        } catch (e) {
            showToast(`다운로드 중 오류가 발생했습니다: ${e}`, 'error');
        }
    }

    async function loadTarotReading() {
        const filename = runtimeViewStateStore.getSnapshot().savedContent.selectedNovel;
        if (!filename) return;

        try {
            setPlotStatus('⏳ 로딩 중...', 'loading');
            const [textContent, metadataJson] = await invoke<[string, string]>('load_novel', { filename });

            if (metadataJson) {
                try {
                    const meta = JSON.parse(metadataJson);
                    if (meta.drawnCards) {
                        setDrawnCards(meta.drawnCards);
                    }
                    if (meta.selectedPreset) {
                        runtimeViewStateStore.setPromptEditor({ selectedPreset: meta.selectedPreset });
                    }
                    if (meta.systemPrompt) {
                        runtimeViewStateStore.setPromptEditor({ systemPrompt: meta.systemPrompt });
                    }
                    if (meta.language || meta.detail) {
                        runtimeViewStateStore.setGenerationParams({
                            ...(meta.language ? { language: meta.language } : {}),
                            ...(meta.detail ? { detail: meta.detail } : {}),
                        });
                    }
                } catch (metaErr) {
                    console.error('Failed to parse metadata JSON:', metaErr);
                }
            }

            setPlotText(textContent);
            setSelectedCardIndex(0);

            const message = '✅ 로딩 완료';
            setPlotStatus(message, 'completed');
            setTimeout(() => setPlotStatus('Idle', 'idle'), 3000);
        } catch (e) {
            setPlotStatus(`❌ 로딩 오류: ${e}`, 'error');
        }
    }

    function clearReading() {
        setDrawnCards([]);
        setSelectedCardIndex(null);
        setPlotText('');
        setPlotStatus('초기화됨', 'idle');
    }

    function stopGeneration() {
        runtimeSessionState.stopRequested = true;
        invoke('stop_generation');
    }

    return {
        onThemeToggle: () => {
            const nextTheme = toggleTheme();
            runtimeViewStateStore.setUiPreferences({ theme: nextTheme });
        },
        onSystemPresetChange: (presetName) => {
            runtimeViewStateStore.setPromptEditor({ selectedPreset: presetName });
        },
        onSystemPromptChange: (systemPrompt) => {
            runtimeViewStateStore.setPromptEditor({ systemPrompt });
        },
        onDrawCards: () => void drawCards(),
        onSelectCard: (index) => setSelectedCardIndex(index),
        onSaveTarotReading: () => void saveTarotReading(),
        onLoadTarotReading: () => void loadTarotReading(),
        onSavedNovelChange: (filename) => {
            runtimeViewStateStore.setSavedContent({ selectedNovel: filename });
        },
        onRefreshNovels: () => void options.reloadNovelList(),
        onClearReading: clearReading,
        onStopGeneration: stopGeneration,
        onOpenOutputFolder: () => {
            invoke('open_output_folder').catch(e => showToast('Failed to open folder: ' + e, 'error'));
        },
    };
}
