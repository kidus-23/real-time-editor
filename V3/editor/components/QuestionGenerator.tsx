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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { BlockNoteEditor } from "@blocknote/core";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";

type QuestionGeneratorProps = {
  editor: BlockNoteEditor;
};

type Question = {
  question: string;
  answer: string;
  explanation: string;
  options?: string[];
};

type Evaluation = {
  isCorrect: boolean;
  score?: number;
  explanation: string;
};

function QuestionGenerator({ editor }: QuestionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionType, setQuestionType] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleStartQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!questionType) {
      toast.error(t("editor.questionGenerator.selectTypeError"));
      return;
    }

    startTransition(async () => {
      setError(null);
      // Get BlockNote editor content
      const blocks = editor.topLevelBlocks;
      console.log("Editor blocks:", blocks);

      let documentData =
        blocks
          .map((block) => {
            if (
              block.type === "paragraph" ||
              block.type === "heading" ||
              block.type === "bulletListItem" ||
              block.type === "numberedListItem"
            ) {
              if (Array.isArray(block.content)) {
                return block.content
                  .map((item) => (item.type === "text" ? item.text : ""))
                  .join("");
              }
              return "";
            }
            return "";
          })
          .filter((text) => text)
          .join("\n") || "No content available";

      documentData = documentData.slice(0, 1000);
      console.log("Request body:", { documentData, questionType });

      if (!documentData || documentData === "No content available") {
        toast.error(t("editor.questionGenerator.noContent"));
        return;
      }

      // Retry logic for question generation
      let res;
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/generateQuestions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                documentData,
                questionType,
              }),
            }
          );

          if (res.ok) {
            const { questions } = await res.json();
            setQuestions(questions);
            setCurrentQuestionIndex(0);
            setUserAnswer("");
            setEvaluation(null);
            return;
          } else {
            const { error } = await res.json();
            console.error(`Attempt ${attempt} failed: ${error}`);
            if (attempt === maxRetries) {
              setError(error);
              toast.error(`${t("editor.questionGenerator.error")}: ${error}`);
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Attempt ${attempt} error:`, errorMessage);
          if (attempt === maxRetries) {
            setError(errorMessage);
            toast.error(`${t("editor.questionGenerator.error")}: ${errorMessage}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    });
  };

  const handleSubmitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!userAnswer) {
      toast.error(t("editor.questionGenerator.yourAnswer"));
      return;
    }

    startTransition(async () => {
      setError(null);
      const currentQuestion = questions[currentQuestionIndex];
      const documentData = editor.topLevelBlocks
        .map((block) => {
          if (
            block.type === "paragraph" ||
            block.type === "heading" ||
            block.type === "bulletListItem" ||
            block.type === "numberedListItem"
          ) {
            if (Array.isArray(block.content)) {
              return block.content
                .map((item) => (item.type === "text" ? item.text : ""))
                .join("");
            }
            return "";
          }
          return "";
        })
        .filter((text) => text)
        .join("\n")
        .slice(0, 1000);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/evaluateAnswer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            userAnswer,
            correctAnswer: currentQuestion.answer,
            questionType,
            documentData,
          }),
        }
      );

      if (res.ok) {
        const { evaluation } = await res.json();
        setEvaluation(evaluation);
      } else {
        const { error } = await res.json();
        setError(error);
        toast.error(`${t("editor.questionGenerator.error")}: ${error}`);
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setEvaluation(null);
    } else {
      setIsOpen(false);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setUserAnswer("");
      setEvaluation(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline" className="hover:bg-black hover:text-white dark:hover:text-white">
        <DialogTrigger>
          <HelpCircleIcon />
          {t("editor.questionGenerator.button")}
        </DialogTrigger>
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editor.questionGenerator.title")}</DialogTitle>
          <DialogDescription>
            {t("editor.questionGenerator.description")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {t("editor.questionGenerator.error")}: {error}
          </div>
        )}

        {questions.length === 0 ? (
          <form className="flex gap-2" onSubmit={handleStartQuiz}>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("editor.questionGenerator.selectType")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trueFalse">
                  {t("editor.questionGenerator.types.trueFalse")}
                </SelectItem>
                <SelectItem value="multipleChoice">
                  {t("editor.questionGenerator.types.multipleChoice")}
                </SelectItem>
                <SelectItem value="shortAnswer">
                  {t("editor.questionGenerator.types.shortAnswer")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!questionType || isPending}>
              {isPending
                ? t("editor.questionGenerator.starting")
                : t("editor.questionGenerator.startQuiz")}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold">
              {t("editor.questionGenerator.question", {
                number: currentQuestionIndex + 1,
                total: questions.length,
              })}
            </h3>
            <p>{questions[currentQuestionIndex].question}</p>

            <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
              {questionType === "trueFalse" && (
                <RadioGroup
                  value={userAnswer}
                  onValueChange={setUserAnswer}
                  disabled={isPending || evaluation !== null}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="True" id="true-option" />
                    <Label htmlFor="true-option" className="cursor-pointer">
                      {t("editor.questionGenerator.true") || "True"}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="False" id="false-option" />
                    <Label htmlFor="false-option" className="cursor-pointer">
                      {t("editor.questionGenerator.false") || "False"}
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {questionType === "multipleChoice" && (
                <RadioGroup
                  value={userAnswer}
                  onValueChange={setUserAnswer}
                  disabled={isPending || evaluation !== null}
                >
                  {questions[currentQuestionIndex].options?.map(
                    (option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    )
                  )}
                </RadioGroup>
              )}

              {questionType === "shortAnswer" && (
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={t("editor.questionGenerator.yourAnswer")}
                  disabled={isPending || evaluation !== null}
                />
              )}

              {!evaluation && (
                <Button type="submit" disabled={!userAnswer || isPending}>
                  {isPending
                    ? t("editor.questionGenerator.starting")
                    : t("editor.questionGenerator.submitAnswer")}
                </Button>
              )}
            </form>

            {evaluation && (
              <div className={`p-4 rounded-lg border-2 ${evaluation.isCorrect
                ? "bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-700"
                : questionType === "shortAnswer" && (evaluation.score ?? 0) >= 7
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-700"
                  : "bg-red-50 dark:bg-red-950/30 border-red-500 dark:border-red-700"
                }`}>
                <p className={`font-bold mb-2 ${evaluation.isCorrect
                  ? "text-green-800 dark:text-green-200"
                  : questionType === "shortAnswer" && (evaluation.score ?? 0) >= 7
                    ? "text-blue-800 dark:text-blue-200"
                    : "text-red-800 dark:text-red-200"
                  }`}>
                  {evaluation.isCorrect
                    ? t("editor.questionGenerator.correctAnswer")
                    : questionType === "shortAnswer"
                      ? t("editor.questionGenerator.score", {
                        score: evaluation.score ?? 0,
                      })
                      : t("editor.questionGenerator.tryAgain")}
                </p>
                <p className="text-gray-800 dark:text-gray-200 mb-3">
                  {evaluation.explanation}
                </p>
                <Button
                  className="mt-2"
                  onClick={handleNextQuestion}
                  disabled={isPending}
                >
                  {currentQuestionIndex < questions.length - 1
                    ? t("editor.questionGenerator.nextQuestion")
                    : t("editor.questionGenerator.finishQuiz")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuestionGenerator;
