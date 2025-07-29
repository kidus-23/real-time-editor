import React from "react";
import { File, Folder, Plus, MoreHorizontal } from "lucide-react";

export default function FileExplorer({ files, activeFile, onFileSelect, onCreateFile }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Explorer</h3>
          <button
            onClick={onCreateFile}
            className="w-6 h-6 rounded-lg clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-2">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors duration-200
              ${activeFile?.id === file.id 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }
            `}
          >
            <File className="w-4 h-4" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}