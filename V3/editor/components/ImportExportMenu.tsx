'use client';

import { ChangeEvent, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
    Block,
    BlockNoteEditor,
    blocksToMarkdown,
    createExternalHTMLExporter,
    HTMLToBlocks,
    markdownToBlocks,
} from '@blocknote/core';
import { useTranslation } from '@/hooks/useTranslation';

const MIME_TYPES = {
    markdown: 'text/markdown',
    html: 'text/html',
    json: 'application/json',
};

type ImportExportMenuProps = {
    editor: BlockNoteEditor | null;
};

function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function ImportExportMenu({ editor }: ImportExportMenuProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const exporter = useMemo(() => {
        if (!editor) return null;
        return createExternalHTMLExporter(editor.pmSchema, editor);
    }, [editor]);

    const handleExport = useCallback(
        async (format: 'markdown' | 'html' | 'json') => {
            if (!editor) return;

            try {
                const blocks = editor.topLevelBlocks as Block[];
                if (blocks.length === 0) {
                    toast.error(t('importExport.emptyEditor'));
                    return;
                }

                if (format === 'json') {
                    downloadFile('document.json', JSON.stringify(blocks, null, 2), MIME_TYPES.json);
                    return;
                }

                if (format === 'markdown') {
                    const markdown = await blocksToMarkdown(blocks, editor.pmSchema, editor, { document });
                    downloadFile('document.md', markdown, MIME_TYPES.markdown);
                    return;
                }

                if (format === 'html') {
                    if (!exporter) throw new Error('Missing HTML exporter');
                    const html = exporter.exportBlocks(blocks, { document });
                    downloadFile('document.html', html, MIME_TYPES.html);
                }
            } catch (error) {
                console.error('Export failed', error);
                toast.error(t('importExport.exportError'));
            }
        },
        [editor, exporter, t]
    );

    const insertBlocks = useCallback(
        (blocks: Block[]) => {
            if (!editor || blocks.length === 0) {
                toast.error(t('importExport.emptyEditor'));
                return;
            }

            const target = editor.getTextCursorPosition()?.block ?? editor.topLevelBlocks.at(-1) ?? editor.topLevelBlocks[0];
            if (target) {
                editor.insertBlocks(blocks, target);
            }

            toast.success(t('importExport.mergeSuccess'));
        },
        [editor, t]
    );

    const handleFileChange = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file || !editor) return;

            try {
                const text = await file.text();
                const extension = file.name.split('.').pop()?.toLowerCase();
                let blocks: Block[] = [];

                if (extension === 'json') {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed)) {
                        blocks = parsed as Block[];
                    } else {
                        throw new Error('Invalid JSON structure');
                    }
                } else if (extension === 'md' || file.type.includes('markdown') || file.type.includes('md')) {
                    blocks = await markdownToBlocks(text, editor.pmSchema);
                } else if (extension === 'html' || file.type.includes('html')) {
                    blocks = await HTMLToBlocks(text, editor.pmSchema);
                } else {
                    toast.error(t('importExport.unsupportedFile'));
                    return;
                }

                insertBlocks(blocks);
            } catch (error) {
                console.error('Import failed', error);
                toast.error(t('importExport.importError'));
            } finally {
                event.target.value = '';
            }
        },
        [editor, insertBlocks, t]
    );

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.html,.htm,.json"
                className="hidden"
                onChange={handleFileChange}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editor}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        {t('importExport.trigger')}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleExport('markdown')}>
                        {t('importExport.exportMarkdown')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport('html')}>
                        {t('importExport.exportHTML')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport('json')}>
                        {t('importExport.exportJSON')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => {
                            fileInputRef.current?.click();
                        }}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {t('importExport.import')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

export default ImportExportMenu;
