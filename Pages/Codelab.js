import React, { useState, useEffect } from "react";
import { Document, User } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { 
  Play, 
  Save, 
  Copy, 
  Download, 
  Plus, 
  FolderOpen,
  Terminal,
  Code,
  FileText,
  Settings,
  Zap
} from "lucide-react";

import CodeEditor from "../components/codelab/CodeEditor";
import FileExplorer from "../components/codelab/FileExplorer";
import OutputPanel from "../components/codelab/OutputPanel";

export default function CodeLab() {
  const [activeFile, setActiveFile] = useState(null);
  const [files, setFiles] = useState([
    {
      id: '1',
      name: 'main.js',
      content: `// Welcome to Code Lab!\n// Write your JavaScript code here\n\nconsole.log('Hello, World!');\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log('Fibonacci sequence:');\nfor (let i = 0; i < 10; i++) {\n  console.log(fibonacci(i));\n}`,
      language: 'javascript',
      type: 'file'
    },
    {
      id: '2', 
      name: 'styles.css',
      content: `/* CSS Styles */\nbody {\n  font-family: 'Inter', sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  margin: 0;\n  padding: 20px;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  background: white;\n  border-radius: 10px;\n  padding: 20px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n}`,
      language: 'css',
      type: 'file'
    },
    {
      id: '3',
      name: 'index.html',
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Code Lab Project</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome to Code Lab!</h1>\n    <p>This is a collaborative coding environment.</p>\n    <button onclick="runCode()">Click me!</button>\n  </div>\n  <script src="main.js"></script>\n</body>\n</html>`,
      language: 'html',
      type: 'file'
    }
  ]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setActiveFile(files[0]);
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const updateFileContent = (fileId, newContent) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId ? { ...file, content: newContent } : file
      )
    );
    
    if (activeFile && activeFile.id === fileId) {
      setActiveFile(prev => ({ ...prev, content: newContent }));
    }
  };

  const runCode = async () => {
    if (!activeFile) return;
    
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      if (activeFile.language === 'javascript') {
        // Simulate code execution
        const logs = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          logs.push(args.join(' '));
        };

        try {
          // Use Function constructor to safely execute code
          const func = new Function(activeFile.content);
          func();
          setOutput(logs.join('\n') || 'Code executed successfully!');
        } catch (error) {
          setOutput(`Error: ${error.message}`);
        } finally {
          console.log = originalConsoleLog;
        }
      } else if (activeFile.language === 'python') {
        // For Python, we'd need a backend service
        setOutput('Python execution not implemented yet');
      } else {
        setOutput('File preview:\n\n' + activeFile.content);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveToDocument = async () => {
    if (!activeFile || !user) return;

    try {
      await Document.create({
        title: `${activeFile.name} - Code Lab`,
        content: `<pre><code class="language-${activeFile.language}">${activeFile.content}</code></pre>`,
        type: 'code',
        tags: ['code-lab', activeFile.language],
        is_public: false,
        created_by: user.email
      });
      
      setOutput(prev => prev + `\nSaved ${activeFile.name} to documents!`);
    } catch (error) {
      setOutput(prev => prev + `\nError saving file: ${error.message}`);
    }
  };

  const createNewFile = () => {
    const newFile = {
      id: Date.now().toString(),
      name: 'untitled.js',
      content: '// New file\n',
      language: 'javascript',
      type: 'file'
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  };

  const aiOptimizeCode = async () => {
    if (!activeFile) return;
    
    setIsRunning(true);
    setOutput('AI is analyzing your code...\n');

    try {
      const result = await InvokeLLM({
        prompt: `Analyze and optimize this ${activeFile.language} code. Provide improvements for performance, readability, and best practices:\n\n${activeFile.content}`,
        response_json_schema: {
          type: "object",
          properties: {
            optimized_code: { type: "string" },
            improvements: { 
              type: "array",
              items: { type: "string" }
            },
            explanation: { type: "string" }
          }
        }
      });

      const optimizedContent = result.optimized_code || activeFile.content;
      updateFileContent(activeFile.id, optimizedContent);
      
      setOutput([
        'AI Optimization Complete!',
        '',
        'Improvements made:',
        ...result.improvements.map(imp => `• ${imp}`),
        '',
        'Explanation:',
        result.explanation
      ].join('\n'));

    } catch (error) {
      setOutput(`AI optimization error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl clay-element border-r border-white/20 dark:border-gray-700/20 flex flex-col">
        {/* File Explorer Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Files</h3>
            <button
              onClick={createNewFile}
              className="w-8 h-8 rounded-xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 p-4 space-y-1">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-all duration-300 clay-button
                ${activeFile?.id === file.id 
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 clay-element' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <Code className="w-4 h-4" />
              <span className="font-medium truncate">{file.name}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
          <button
            onClick={saveToDocument}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 clay-button font-medium"
          >
            <Save className="w-4 h-4" />
            Save to Docs
          </button>
          
          <button
            onClick={aiOptimizeCode}
            disabled={isRunning}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 clay-button font-medium disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            AI Optimize
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl clay-element border-b border-white/20 dark:border-gray-700/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {activeFile?.name || 'No file selected'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {activeFile?.language || 'text'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runCode}
                disabled={isRunning || !activeFile}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-400 to-blue-400 text-white clay-element font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : 'Run'}
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(activeFile?.content || '')}
                className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1 p-6">
            {activeFile ? (
              <CodeEditor
                file={activeFile}
                onChange={(content) => updateFileContent(activeFile.id, content)}
              />
            ) : (
              <div className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl clay-element flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No file selected
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Choose a file from the sidebar to start coding
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="w-96 p-6 pl-0">
            <OutputPanel output={output} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </div>
  );
}