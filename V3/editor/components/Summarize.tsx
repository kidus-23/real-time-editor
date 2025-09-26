'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FormEvent, useState, useTransition } from "react";
import { BotIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { BlockNoteEditor } from "@blocknote/core";

type SummarizeProps = {
  editor: BlockNoteEditor;
};

function Summarize({ editor }: SummarizeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSummarize = async (e: FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      // Get BlockNote editor content
      const blocks = editor.topLevelBlocks;
      console.log("Editor blocks:", blocks); // Debug: Inspect BlockNote content

      // Convert blocks to text
      let documentData = blocks
        .map(block => {
          if (block.type === "paragraph" || block.type === "heading" || block.type === "bulletListItem" || block.type === "numberedListItem") {
            if (Array.isArray(block.content)) {
              return block.content
                .map(item => (item.type === "text" ? item.text : ""))
                .join("");
            }
            return "";
          }
          return "";
        })
        .filter(text => text)
        .join("\n") || "No content available";

      // Truncate to 1000 characters to avoid timeout
      documentData = documentData.slice(0, 1000);

      console.log("Request body:", { documentData }); // Debug: Inspect request body

      if (!documentData || documentData === "No content available") {
        toast.error("No document content to summarize");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/summarize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentData,
          }),
        }
      );

      if (res.ok) {
        const { summary: summaryText } = await res.json();
        setSummary(summaryText);
        toast.success("Document summarized successfully!");
      } else {
        const { error } = await res.json();
        toast.error(`Summarization failed: ${error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline">
        <DialogTrigger>
          <FileTextIcon />
          Summarize
        </DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Summarize the Document</DialogTitle>
          <DialogDescription>
            AI will generate a summary of the document content.
          </DialogDescription>
          <hr className="mt-5" />
        </DialogHeader>

        {summary && (
          <div className="flex flex-col items-start max-h-96 overflow-y-scroll gap-2 p-5 bg-grey-100">
            <div className="flex">
              <BotIcon className="w-10 flex-shrink-0" />
              <p className="font-bold">
                AI {isPending ? "is thinking..." : "Summary"}:
              </p>
            </div>
            <p>{isPending ? "Thinking..." : <Markdown>{summary}</Markdown>}</p>
          </div>
        )}

        <form className="flex gap-2" onSubmit={handleSummarize}>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Summarizing..." : "Summarize"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Summarize;