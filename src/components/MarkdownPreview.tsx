import { useMemo } from 'react';
import { renderMarkdownToHtml } from '../modules/preview.js';

interface MarkdownPreviewProps {
    className: string;
    content: string;
    id: string;
    style?: React.CSSProperties;
}

export function MarkdownPreview({
    className,
    content,
    id,
    style,
}: MarkdownPreviewProps) {
    const html = useMemo(() => renderMarkdownToHtml(content), [content]);

    return (
        <div
            id={id}
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
