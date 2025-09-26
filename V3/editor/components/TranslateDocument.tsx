'use client'

import * as Y from "yjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FormEvent, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BotIcon, LanguagesIcon } from "lucide-react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { BlockNoteEditor } from "@blocknote/core";

// Map frontend language names to ISO 639-1 codes for M2M100 model
const languageMap: Record<string, string> = {
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  chinese: "zh",
  japanese: "ja",
  russian: "ru",
  arabic: "ar",
  hindi: "hi",
  portuguese: "pt",
  korean: "ko",
  italian: "it",
};

const languages = Object.keys(languageMap) as (keyof typeof languageMap)[];

type TranslateDocumentProps = {
  doc: Y.Doc;
  editor: BlockNoteEditor;
};

function TranslateDocument({ doc, editor }: TranslateDocumentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleAskQuestion = async (e: FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      // Get BlockNote editor content
      const blocks = editor.topLevelBlocks;
      console.log("Editor blocks:", blocks); // Debug: Inspect BlockNote content

      // Convert blocks to text (extract text from each block)
      const documentData = blocks
        .map(block => {
          if (block.type === "paragraph" || block.type === "heading" || block.type === "bulletListItem" || block.type === "numberedListItem") {
            // Handle content as an array of inline elements
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

      const targetLang = languageMap[language] || "";
      console.log("Request body:", { documentData, targetLang }); // Debug: Inspect request body

      if (!documentData || documentData === "No content available") {
        toast.error("No document content to translate");
        return;
      }
      if (!targetLang) {
        toast.error("Please select a valid language");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/translateDocument`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentData,
            targetLang,
          }),
        }
      );

      if (res.ok) {
        const { translated_text } = await res.json();
        setSummary(translated_text);
        toast.success("Document translated successfully!");
      } else {
        const { error } = await res.json();
        toast.error(`Translation failed: ${error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline">
        <DialogTrigger>
          <LanguagesIcon />
          Translate
        </DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Translate the Document</DialogTitle>
          <DialogDescription>
            Select the language you want to translate the document to and AI will translate a summary 
            of the document in the selected language.
          </DialogDescription>
          <hr className="mt-5" />
          {question && <p className="mt-5 text-gray-500">Q: {question}</p>}
        </DialogHeader>

        {summary && (
          <div className="flex flex-col items-start max-h-96 overflow-y-scroll gap-2 p-5 bg-grey-100">
            <div className="flex">
              <BotIcon className="w-10 flex-shrink-0" />
              <p className="font-bold">
                GPT {isPending ? "is thinking..." : "Says"}:
              </p>
            </div>
            <p>{isPending ? "Thinking..." : <Markdown>{summary}</Markdown>}</p>
          </div>
        )}

        <form className="flex gap-2" onSubmit={handleAskQuestion}>
          <Select value={language} onValueChange={(value) => setLanguage(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a language..." />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language.charAt(0).toUpperCase() + language.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!language || isPending}>
            {isPending ? "Translating..." : "Translate"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TranslateDocument;