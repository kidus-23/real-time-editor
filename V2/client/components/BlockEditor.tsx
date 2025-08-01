import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface BlockEditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
}

export function BlockEditor({ initialContent, onChange }: BlockEditorProps) {
  const { isDark } = useTheme();

  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        type: "paragraph",
        content: "Type '/' for commands"
      }
    ]
  });

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full">
        <BlockNoteView
          editor={editor}
          onChange={() => {
            if (onChange) {
              onChange(editor.document);
            }
          }}
          theme={isDark ? "dark" : "light"}
          className="h-full"
        />
      </div>
    </div>
  );
}
