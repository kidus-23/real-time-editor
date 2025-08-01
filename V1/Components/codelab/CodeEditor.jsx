import React from "react";

export default function CodeEditor({ file, onChange }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl clay-element overflow-hidden">
      <textarea
        value={file.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-6 bg-transparent border-none outline-none resize-none font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
        placeholder="Start typing your code..."
        spellCheck={false}
        style={{
          tabSize: 2,
          lineHeight: '1.6'
        }}
      />
    </div>
  );
}