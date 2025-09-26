'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FormEvent, useState, useTransition } from "react";
import { BotIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { BlockNoteEditor, Block } from "@blocknote/core";
import { marked } from "marked";

type ComposerProps = {
  editor: BlockNoteEditor;
};

function Composer({ editor }: ComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Parse Markdown to BlockNote blocks
  const markdownToBlockNote = (markdown: string): Block[] => {
    const tokens = marked.lexer(markdown);
    const blocks: Block[] = [];

    tokens.forEach((token: any) => {
      if (token.type === "heading") {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9), // Unique ID
          type: "heading",
          props: { level: token.depth },
          content: [{ type: "text", text: token.text, styles: {} }],
        });
      } else if (token.type === "paragraph") {
        const content = [];
        // Parse inline tokens for bold, italic, etc.
        const inlineTokens = marked.lexer(token.text)[0]?.tokens || [];
        let currentText = "";
        let currentStyles: any = {};

        inlineTokens.forEach((inline: any) => {
          if (inline.type === "strong") {
            if (currentText) {
              content.push({ type: "text", text: currentText, styles: currentStyles });
              currentText = "";
              currentStyles = {};
            }
            content.push({ type: "text", text: inline.text, styles: { bold: true } });
          } else if (inline.type === "text") {
            currentText += inline.text;
          }
        });

        if (currentText) {
          content.push({ type: "text", text: currentText, styles: currentStyles });
        }

        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: "paragraph",
          content,
        });
      } else if (token.type === "list") {
        token.items.forEach((item: any) => {
          const content = [];
          const inlineTokens = marked.lexer(item.text)[0]?.tokens || [];
          let currentText = "";
          let currentStyles: any = {};

          inlineTokens.forEach((inline: any) => {
            if (inline.type === "strong") {
              if (currentText) {
                content.push({ type: "text", text: currentText, styles: currentStyles });
                currentText = "";
                currentStyles = {};
              }
              content.push({ type: "text", text: inline.text, styles: { bold: true } });
            } else if (inline.type === "text") {
              currentText += inline.text;
            }
          });

          if (currentText) {
            content.push({ type: "text", text: currentText, styles: currentStyles });
          }

          blocks.push({
            id: Math.random().toString(36).substr(2, 9),
            type: token.ordered ? "numberedListItem" : "bulletListItem",
            content,
          });
        });
      }
    });

    return blocks;
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      if (!prompt) {
        toast.error("Please enter a prompt");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/composer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      );

      if (res.ok) {
        const { generated } = await res.json();
        // Parse Markdown and convert to BlockNote blocks
        const blocks = markdownToBlockNote(generated);
        if (blocks.length === 0) {
          toast.error("No valid content generated");
          return;
        }
        // Insert blocks at current cursor position
        editor.insertBlocks(blocks, editor.getTextCursorPosition().block);
        toast.success("Content generated and inserted!");
        setIsOpen(false);
        setPrompt("");
      } else {
        const { error } = await res.json();
        toast.error(`Generation failed: ${error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline">
        <DialogTrigger>
          <PencilIcon />
          AI Composer
        </DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Composer</DialogTitle>
          <DialogDescription>
            Enter a prompt and AI will generate content to insert at your cursor.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-2" onSubmit={handleGenerate}>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt (e.g., 'A short poem about love')"
            disabled={isPending}
          />
          <Button type="submit" disabled={!prompt || isPending}>
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Composer;