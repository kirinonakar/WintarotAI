export function eventHasFiles(event: DragEvent) {
    const types = event.dataTransfer?.types;
    if (types) {
        if (typeof types.includes === 'function' && types.includes('Files')) return true;
        if (typeof (types as any).contains === 'function' && (types as any).contains('Files')) return true;
    }

    if (event.dataTransfer?.files?.length) return true;
    return Array.from<DataTransferItem>(event.dataTransfer?.items || []).some(item => item.kind === 'file');
}
