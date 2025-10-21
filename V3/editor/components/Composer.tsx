"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { FormEvent, useState, useTransition } from "react";
import { BotIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { BlockNoteEditor, Block } from "@blocknote/core";
import { marked } from "marked";
import { useTranslation } from "@/hooks/useTranslation";

type ComposerProps = {
  editor: BlockNoteEditor;
};

function Composer({ editor }: ComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  // Parse Markdown to BlockNote blocks
  // Small helper types to describe a minimal inline text node used below
  type InlineText = {
    type: "text";
    text: string;
    styles?: Record<string, unknown>;
  };

  // Minimal token variants we expect from marked. Keep unknown for unmodeled fields.
  type HeadingToken = { type: "heading"; depth: number; text: string };
  type ParagraphToken = { type: "paragraph"; text: string };
  type ListItem = { text: string };
  type ListToken = { type: "list"; items: ListItem[]; ordered?: boolean };
  type MarkedToken =
    | HeadingToken
    | ParagraphToken
    | ListToken
    | { type?: string; [key: string]: unknown };

  const markdownToBlockNote = (markdown: string): Block[] => {
    const tokens = marked.lexer(markdown) as unknown as MarkedToken[];
    const blocks: Block[] = [];

    tokens.forEach((token) => {
      if (token.type === "heading") {
        const t = token as HeadingToken;
        const headingBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: "heading",
          props: { level: t.depth },
          content: [{ type: "text", text: t.text, styles: {} } as InlineText],
        };

        blocks.push(headingBlock as unknown as Block);
      } else if (token.type === "paragraph") {
        const t = token as ParagraphToken;
        const content: InlineText[] = [];

        // marked's inline tokens live inside the first child token's `tokens` array
        const first = marked.lexer(t.text)[0] as unknown as
          | { tokens?: unknown[] }
          | undefined;
        const inlineTokens = (first?.tokens ?? []) as unknown[];

        let currentText = "";
        let currentStyles: Record<string, unknown> = {};

        inlineTokens.forEach((inlineRaw) => {
          const inline = inlineRaw as { type?: string; text?: string };
          if (inline.type === "strong") {
            if (currentText) {
              content.push({
                type: "text",
                text: currentText,
                styles: currentStyles,
              });
              currentText = "";
              currentStyles = {};
            }
            content.push({
              type: "text",
              text: inline.text ?? "",
              styles: { bold: true },
            });
          } else if (inline.type === "text") {
            currentText += inline.text ?? "";
          }
        });

        if (currentText) {
          content.push({
            type: "text",
            text: currentText,
            styles: currentStyles,
          });
        }

        const paraBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: "paragraph",
          content: content as unknown,
        };

        blocks.push(paraBlock as unknown as Block);
      } else if (token.type === "list") {
        const t = token as ListToken;
        t.items.forEach((item) => {
          const content: InlineText[] = [];
          const first = marked.lexer(item.text)[0] as unknown as
            | { tokens?: unknown[] }
            | undefined;
          const inlineTokens = (first?.tokens ?? []) as unknown[];

          let currentText = "";
          let currentStyles: Record<string, unknown> = {};

          inlineTokens.forEach((inlineRaw) => {
            const inline = inlineRaw as { type?: string; text?: string };
            if (inline.type === "strong") {
              if (currentText) {
                content.push({
                  type: "text",
                  text: currentText,
                  styles: currentStyles,
                });
                currentText = "";
                currentStyles = {};
              }
              content.push({
                type: "text",
                text: inline.text ?? "",
                styles: { bold: true },
              });
            } else if (inline.type === "text") {
              currentText += inline.text ?? "";
            }
          });

          if (currentText) {
            content.push({
              type: "text",
              text: currentText,
              styles: currentStyles,
            });
          }

          const listItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: t.ordered ? "numberedListItem" : "bulletListItem",
            content: content as unknown,
          };

          blocks.push(listItem as unknown as Block);
        });
      }
    });

    return blocks;
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      if (!prompt) {
        toast.error(t("editor.compose.noPrompt"));
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/composer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (res.ok) {
        const { generated } = await res.json();
        // Parse Markdown and convert to BlockNote blocks
        const blocks = markdownToBlockNote(generated);
        if (blocks.length === 0) {
          toast.error(t("editor.compose.error"));
          return;
        }
        // Insert blocks at current cursor position
        editor.insertBlocks(blocks, editor.getTextCursorPosition().block);
        toast.success(t("editor.compose.insertBelow"));
        setIsOpen(false);
        setPrompt("");
      } else {
        const { error } = await res.json();
        toast.error(`${t("editor.compose.error")}: ${error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline">
        <DialogTrigger>
          <PencilIcon />
          {t("editor.compose.button")}
        </DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editor.compose.title")}</DialogTitle>
          <DialogDescription>
            {t("editor.compose.description")}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-2" onSubmit={handleGenerate}>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("editor.compose.placeholder")}
            disabled={isPending}
          />
          <Button type="submit" disabled={!prompt || isPending}>
            {isPending
              ? t("editor.compose.generating")
              : t("editor.compose.button")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Composer;
