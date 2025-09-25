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


// Language codes following the ISO standard used by Cloudflare AI models
type Language =
    | "en" // English
    | "es" // Spanish
    | "fr" // French
    | "de" // German
    | "zh" // Chinese
    | "ja" // Japanese
    | "ru" // Russian
    | "ar" // Arabic
    | "hi" // Hindi
    | "pt" // Portuguese
    | "ko" // Korean
    | "it"; // Italian

const languageDisplay: Record<Language, string> = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ru": "Russian",
    "ar": "Arabic",
    "hi": "Hindi",
    "pt": "Portuguese",
    "ko": "Korean",
    "it": "Italian"
};

const languages: Language[] = [
    "en",
    "es",
    "fr",
    "de",
    "zh",
    "ja",
    "ru",
    "ar",
    "hi",
    "pt",
    "ko",
    "it"
];

function TranslateDocument({ doc }: { doc: Y.Doc }) {

    const [isOpen, setIsOpen] = useState(false);
    const [language, setLanguage] = useState<string>("");
    const [summary, setSummary] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const [connectionTested, setConnectionTested] = useState(false);

    // Test the API connection when the component mounts
    const testApiConnection = async () => {
        try {
            const cloudflareUrl = "https://solitary-mouse-1682.kidusyonas8.workers.dev";
            const testEndpoint = `${cloudflareUrl}/test`;

            console.log("Testing API connection to:", testEndpoint);
            const response = await fetch(testEndpoint);

            if (response.ok) {
                const data = await response.json();
                console.log("API test successful:", data);
                setConnectionTested(true);
                return true;
            } else {
                console.error("API test failed:", response.status);
                return false;
            }
        } catch (error) {
            console.error("API connection test error:", error);
            return false;
        }
    };

    const handleAskQuestion = async (e: FormEvent) => {
        e.preventDefault();

        if (!language) {
            toast.error("Please select a language first");
            return;
        }

        startTransition(async () => {
            try {
                // Check if document has content
                const documentStore = doc.get("document-store");
                const documentData = documentStore.toJSON();

                // If document is empty, show error
                if (!documentData || Object.keys(documentData).length === 0) {
                    toast.error("Document is empty. Please add some content first.");
                    setSummary("Error: Document is empty. Please add some content first.");
                    return;
                }

                console.log("Document data:", documentData);
                console.log("Selected language:", language);

                // Show a loading message
                setSummary("Generating translation...");

                // Use a hardcoded URL if the environment variable is not working
                const cloudflareUrl = "https://solitary-mouse-1682.kidusyonas8.workers.dev";
                const endpoint = `${cloudflareUrl}/translateDocument`;
                console.log("Endpoint URL:", endpoint);

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentData,
                        targetLang: language,
                    }),
                    // Adding these options to help with CORS issues
                    mode: "cors",
                    credentials: "omit"
                });

                console.log("Response status:", res.status);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("API error:", res.status, errorText);
                    toast.error(`Translation failed: ${res.status} ${res.statusText}`);
                    setSummary(`Error: ${res.status} ${res.statusText}\n${errorText}`);
                    return;
                }

                const data = await res.json();
                console.log("API response:", data);

                if (data.error) {
                    toast.error(`Error: ${data.error}`);
                    setSummary(`Error: ${data.error}\n${data.message || ''}`);
                    return;
                }

                if (data.translated_text) {
                    setSummary(data.translated_text);
                    toast.success("Document translated successfully!");
                } else if (data.text) {
                    setSummary(data.text);
                    toast.success("Document translated successfully!");
                } else {
                    setSummary(JSON.stringify(data, null, 2));
                    toast.warning("Received unexpected response format");
                }
            } catch (error) {
                console.error("Translation error:", error);
                toast.error("Failed to translate document. Check console for details.");
                setSummary(`Translation error occurred: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    };



    const handleDialogOpen = async () => {
        // Reset the summary when opening the dialog
        setSummary("");
        setIsOpen(true);

        // Test API connection if not already tested
        if (!connectionTested) {
            const isConnected = await testApiConnection();
            if (!isConnected) {
                setSummary("⚠️ Warning: Could not connect to translation service. Translation functionality may not work properly.");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (open) {
                void handleDialogOpen();
            } else {
                // Only close if not pending
                if (!isPending) {
                    setIsOpen(false);
                } else {
                    // Keep dialog open if translation is in progress
                    toast.info("Please wait for translation to complete");
                }
            }
        }}>
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
                        Select the language you want to translate the document to and AI will traslate a summary
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
                        <div className="markdown-content">
                            {isPending ? "Thinking..." : <Markdown>{summary}</Markdown>}
                        </div>
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
                                    {languageDisplay[language]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit" disabled={!languages || isPending}>
                        {isPending ? "Translating..." : "Translate"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
export default TranslateDocument