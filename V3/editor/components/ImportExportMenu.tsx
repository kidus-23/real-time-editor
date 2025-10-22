'use client';

import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Loader2, FileDown, FileUp, FileText, File, FileJson, FileCode } from 'lucide-react';
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
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

const MIME_TYPES = {
    markdown: 'text/markdown',
    html: 'text/html',
    json: 'application/json',
};

type ImportExportMenuProps = {
    editor: BlockNoteEditor | null;
    asMenuItem?: boolean; // When true, renders as plain text instead of button
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

function ImportExportMenu({ editor, asMenuItem = false }: ImportExportMenuProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedImportType, setSelectedImportType] = useState<string | null>(null);

    const exporter = useMemo(() => {
        if (!editor) return null;
        return createExternalHTMLExporter(editor.pmSchema, editor);
    }, [editor]);

    const handleExportPDF = useCallback(async () => {
        if (!editor) return;

        setIsExporting(true);
        toast.info(t('importExport.generatingPDF'));

        try {
            const blocks = editor.topLevelBlocks as Block[];
            if (blocks.length === 0) {
                toast.error(t('importExport.emptyEditor'));
                return;
            }

            const pdf = new jsPDF();
            let yPosition = 20;
            const pageHeight = pdf.internal.pageSize.height;
            const pageWidth = pdf.internal.pageSize.width;
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;

            // Helper to add new page if needed
            const checkPageBreak = (height: number) => {
                if (yPosition + height > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
            };

            blocks.forEach((block: Block) => {
                const content = Array.isArray(block.content) 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? block.content.map((c: any) => {
                        if ('text' in c) return c.text;
                        if ('content' in c && typeof c.content === 'string') return c.content;
                        return '';
                    }).join('') 
                    : '';

                if (block.type === 'heading') {
                    const fontSize = block.props?.level === 1 ? 18 : block.props?.level === 2 ? 16 : 14;
                    pdf.setFontSize(fontSize);
                    pdf.setFont('helvetica', 'bold');
                    checkPageBreak(fontSize * 0.5);
                    const lines = pdf.splitTextToSize(content, maxWidth);
                    pdf.text(lines, margin, yPosition);
                    yPosition += (lines.length * fontSize * 0.5) + 10;
                } else if (block.type === 'paragraph') {
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    checkPageBreak(12 * 0.5);
                    const lines = pdf.splitTextToSize(content, maxWidth);
                    pdf.text(lines, margin, yPosition);
                    yPosition += (lines.length * 12 * 0.5) + 8;
                } else if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    checkPageBreak(12 * 0.5);
                    const bullet = block.type === 'bulletListItem' ? '• ' : '  ';
                    const lines = pdf.splitTextToSize(bullet + content, maxWidth - 10);
                    pdf.text(lines, margin + 10, yPosition);
                    yPosition += (lines.length * 12 * 0.5) + 6;
                }
            });

            pdf.save('document.pdf');
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error('PDF export failed', error);
            toast.error(t('importExport.exportError'));
        } finally {
            setIsExporting(false);
        }
    }, [editor, t]);

    const handleExportDOCX = useCallback(async () => {
        if (!editor) return;

        setIsExporting(true);
        toast.info(t('importExport.generatingDOCX'));

        try {
            const blocks = editor.topLevelBlocks as Block[];
            if (blocks.length === 0) {
                toast.error(t('importExport.emptyEditor'));
                return;
            }

            const docParagraphs: Paragraph[] = [];

            blocks.forEach((block: Block) => {
                const content = Array.isArray(block.content) 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? block.content.map((c: any) => {
                        if ('text' in c) return c.text;
                        if ('content' in c && typeof c.content === 'string') return c.content;
                        return '';
                    }).join('') 
                    : '';

                if (block.type === 'heading') {
                    const level = block.props?.level === 1 ? HeadingLevel.HEADING_1 :
                        block.props?.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
                    docParagraphs.push(
                        new Paragraph({
                            text: content,
                            heading: level,
                        })
                    );
                } else if (block.type === 'paragraph') {
                    docParagraphs.push(
                        new Paragraph({
                            children: [new TextRun(content)],
                        })
                    );
                } else if (block.type === 'bulletListItem') {
                    docParagraphs.push(
                        new Paragraph({
                            text: content,
                            bullet: {
                                level: 0,
                            },
                        })
                    );
                } else if (block.type === 'numberedListItem') {
                    docParagraphs.push(
                        new Paragraph({
                            text: content,
                            numbering: {
                                reference: 'default-numbering',
                                level: 0,
                            },
                        })
                    );
                }
            });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docParagraphs,
                }],
                numbering: {
                    config: [{
                        reference: 'default-numbering',
                        levels: [{
                            level: 0,
                            format: 'decimal',
                            text: '%1.',
                            alignment: AlignmentType.START,
                        }],
                    }],
                },
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'document.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('DOCX exported successfully');
        } catch (error) {
            console.error('DOCX export failed', error);
            toast.error(t('importExport.exportError'));
        } finally {
            setIsExporting(false);
        }
    }, [editor, t]);

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

    const handleImportClick = (type: 'markdown' | 'html' | 'json') => {
        setSelectedImportType(type);
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={
                    selectedImportType === 'markdown' ? '.md,.markdown' :
                        selectedImportType === 'html' ? '.html,.htm' :
                            selectedImportType === 'json' ? '.json' :
                                '.md,.markdown,.html,.htm,.json'
                }
                className="hidden"
                onChange={handleFileChange}
            />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    {asMenuItem ? (
                        <span className="cursor-pointer" onClick={() => setIsOpen(true)}>
                            {t('importExport.trigger')}
                        </span>
                    ) : (
                        <Button variant="outline" size="sm" className="gap-2" disabled={!editor || isExporting}>
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {t('importExport.trigger')}
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('importExport.trigger')}</DialogTitle>
                        <DialogDescription>
                            Export your document to various formats or import content from existing files
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Export Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <FileDown className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-lg">Export</h3>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    disabled={isExporting}
                                    onClick={() => {
                                        handleExport('markdown');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileText className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Markdown</span>
                                        <span className="text-xs text-muted-foreground">Plain text with formatting</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    disabled={isExporting}
                                    onClick={() => {
                                        handleExport('html');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileCode className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">HTML</span>
                                        <span className="text-xs text-muted-foreground">Web page format</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    disabled={isExporting}
                                    onClick={() => {
                                        handleExport('json');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileJson className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">JSON</span>
                                        <span className="text-xs text-muted-foreground">Structured data format</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    disabled={isExporting}
                                    onClick={() => {
                                        handleExportPDF();
                                        setIsOpen(false);
                                    }}
                                >
                                    <File className="h-4 w-4 text-red-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">PDF</span>
                                        <span className="text-xs text-muted-foreground">Portable document</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    disabled={isExporting}
                                    onClick={() => {
                                        handleExportDOCX();
                                        setIsOpen(false);
                                    }}
                                >
                                    <File className="h-4 w-4 text-blue-500" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">DOCX</span>
                                        <span className="text-xs text-muted-foreground">Microsoft Word format</span>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {/* Import Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <FileUp className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-lg">Import</h3>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    onClick={() => {
                                        handleImportClick('markdown');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileText className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Markdown (.md)</span>
                                        <span className="text-xs text-muted-foreground">Import from Markdown file</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    onClick={() => {
                                        handleImportClick('html');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileCode className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">HTML (.html)</span>
                                        <span className="text-xs text-muted-foreground">Import from HTML file</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3"
                                    onClick={() => {
                                        handleImportClick('json');
                                        setIsOpen(false);
                                    }}
                                >
                                    <FileJson className="h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">JSON (.json)</span>
                                        <span className="text-xs text-muted-foreground">Import from JSON file</span>
                                    </div>
                                </Button>
                            </div>

                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Note:</strong> Imported content will be inserted at your current cursor position in the document.
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ImportExportMenu;
