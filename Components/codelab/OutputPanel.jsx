import React from "react";
import { Terminal, Play, AlertCircle, CheckCircle } from "lucide-react";

export default function OutputPanel({ output, isRunning }) {
  const hasError = output.toLowerCase().includes('error');
  
  return (
    <div className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl clay-element flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="w-8 h-8 rounded-2xl bg-gray-100 dark:bg-gray-700 clay-inner flex items-center justify-center">
          <Terminal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Output</h3>
        
        <div className="ml-auto flex items-center gap-2">
          {isRunning ? (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Running...</span>
            </div>
          ) : hasError ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
          ) : output && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Success</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {output ? (
          <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap leading-relaxed">
            {output}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Run your code to see output here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}