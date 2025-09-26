'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FormEvent, useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BotIcon, HelpCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { BlockNoteEditor } from "@blocknote/core";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

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

  const handleStartQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!questionType) {
      toast.error("Please select a question type");
      return;
    }

    startTransition(async () => {
      setError(null);
      // Get BlockNote editor content
      const blocks = editor.topLevelBlocks;
      console.log("Editor blocks:", blocks);

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

      documentData = documentData.slice(0, 1000);
      console.log("Request body:", { documentData, questionType });

      if (!documentData || documentData === "No content available") {
        toast.error("No document content to generate questions");
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
            toast.success("Questions generated successfully!");
            return;
          } else {
            const { error } = await res.json();
            console.error(`Attempt ${attempt} failed: ${error}`);
            if (attempt === maxRetries) {
              setError(error);
              toast.error(`Failed to generate questions: ${error}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Attempt ${attempt} error:`, err.message);
          if (attempt === maxRetries) {
            setError(err.message);
            toast.error(`Failed to generate questions: ${err.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
  };

  const handleSubmitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!userAnswer) {
      toast.error("Please provide an answer");
      return;
    }

    startTransition(async () => {
      setError(null);
      const currentQuestion = questions[currentQuestionIndex];
      const documentData = editor.topLevelBlocks
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
        toast.error(`Failed to evaluate answer: ${error}`);
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
      toast.success("Quiz completed!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild variant="outline">
        <DialogTrigger>
          <HelpCircleIcon />
          Q&A
        </DialogTrigger>
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Question Generator</DialogTitle>
          <DialogDescription>
            Select a question type to generate a quiz based on the document content.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {questions.length === 0 ? (
          <form className="flex gap-2" onSubmit={handleStartQuiz}>
            <Select value={questionType} onValueChange={setQuestionType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select question type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trueFalse">True/False</SelectItem>
                <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                <SelectItem value="shortAnswer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!questionType || isPending}>
              {isPending ? "Generating..." : "Start Quiz"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            <p>{questions[currentQuestionIndex].question}</p>

            <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
              {questionType === "trueFalse" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={userAnswer === "true" ? "default" : "outline"}
                    onClick={() => setUserAnswer("true")}
                    disabled={isPending || evaluation !== null}
                  >
                    True
                  </Button>
                  <Button
                    type="button"
                    variant={userAnswer === "false" ? "default" : "outline"}
                    onClick={() => setUserAnswer("false")}
                    disabled={isPending || evaluation !== null}
                  >
                    False
                  </Button>
                </div>
              )}

              {questionType === "multipleChoice" && (
                <RadioGroup
                  value={userAnswer}
                  onValueChange={setUserAnswer}
                  disabled={isPending || evaluation !== null}
                >
                  {questions[currentQuestionIndex].options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {questionType === "shortAnswer" && (
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  disabled={isPending || evaluation !== null}
                />
              )}

              {!evaluation && (
                <Button type="submit" disabled={!userAnswer || isPending}>
                  {isPending ? "Evaluating..." : "Submit Answer"}
                </Button>
              )}
            </form>

            {evaluation && (
              <div className="p-4 bg-gray-100 rounded">
                <p className="font-bold">
                  {evaluation.isCorrect
                    ? "Correct!"
                    : questionType === "shortAnswer"
                    ? `Score: ${evaluation.score}%`
                    : "Incorrect"}
                </p>
                <p>{evaluation.explanation}</p>
                <Button
                  className="mt-2"
                  onClick={handleNextQuestion}
                  disabled={isPending}
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
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