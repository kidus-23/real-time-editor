import React, { useState, useEffect, useRef } from "react";
// import io from 'socket.io-client'; // Uncomment and install socket.io-client for real-time
import { Page, User } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { 
  Save, 
  Share2, 
  MoreHorizontal, 
  Edit3, 
  Wand2,
  Sparkles,
  Type,
  Bold,
  Italic,
  List,
  Code
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function Editor() {
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([
    { id: Date.now().toString(), type: 'markdown', content: '' }
  ]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiMenuPosition, setAIMenuPosition] = useState({ x: 0, y: 0 });
  const [user, setUser] = useState(null);
  const blockRefs = useRef({});
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadPage();
    loadUser();
  }, []);

  useEffect(() => {
    // Auto-save after 2 seconds of no changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (page && (JSON.stringify(blocks) !== JSON.stringify(page.blocks || []) || title !== page.title)) {
      saveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [blocks, title, page]);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadPage = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pageId = urlParams.get('pageId');
      if (pageId) {
        const pageData = await Page.get(pageId);
        setPage(pageData);
        setTitle(pageData.title);
        if (Array.isArray(pageData.blocks)) {
          setBlocks(pageData.blocks);
        } else if (typeof pageData.content === 'string') {
          // Migrate old content to a single markdown block
          setBlocks([{ id: Date.now().toString(), type: 'markdown', content: pageData.content }]);
        } else {
          setBlocks([{ id: Date.now().toString(), type: 'markdown', content: '' }]);
        }
      } else {
        // Create new page
        const newPage = await Page.create({
          title: "Untitled",
          blocks: [{ id: Date.now().toString(), type: 'markdown', content: '# Start writing...\n\nYour markdown content goes here.' }],
          template: "blank"
        });
        setPage(newPage);
        setTitle(newPage.title);
        setBlocks(newPage.blocks);
      }
    } catch (error) {
      console.error("Error loading page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = async () => {
    if (!page || isSaving) return;
    setIsSaving(true);
    try {
      await Page.update(page.id, {
        title: title,
        blocks: blocks
      });
      setPage(prev => ({
        ...prev,
        title: title,
        blocks: blocks
      }));
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selection = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );

    if (selection.trim()) {
      setSelectedText(selection);
      
      // Calculate menu position
      const rect = textarea.getBoundingClientRect();
      setAIMenuPosition({
        x: rect.left + (textarea.selectionStart * 8), // Approximate character width
        y: rect.top + 40
      });
      setShowAIMenu(true);
    } else {
      setShowAIMenu(false);
    }
  };

  const handleAIAction = async (action, customPrompt = "") => {
    if (!selectedText.trim()) return;
    
    setShowAIMenu(false);
    setIsSaving(true);

    try {
      let prompt = "";
      
      switch (action) {
        case "summarize":
          prompt = `Summarize this text concisely: "${selectedText}"`;
          break;
        case "expand":
          prompt = `Expand and elaborate on this text with more details: "${selectedText}"`;
          break;
        case "improve":
          prompt = `Improve the writing quality and clarity of this text: "${selectedText}"`;
          break;
        case "custom":
          prompt = `${customPrompt}: "${selectedText}"`;
          break;
        default:
          prompt = `Rewrite this text to be better: "${selectedText}"`;
      }

      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            improved_text: { type: "string" }
          }
        }
      });

      // Replace selected text with AI result
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + 
                        result.improved_text + 
                        content.substring(end);
      
      setContent(newContent);
      setSelectedText("");
      
    } catch (error) {
      console.error("AI action error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const insertMarkdown = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = "";

    switch (type) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        break;
      case "code":
        replacement = `\`${selectedText || "code"}\``;
        break;
      case "list":
        replacement = `\n- ${selectedText || "list item"}`;
        break;
      case "heading":
        replacement = `\n## ${selectedText || "heading"}`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-3xl bg-purple-100 dark:bg-purple-900/50 clay-element animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Editor Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl clay-element border-b border-white/20 dark:border-gray-700/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
              placeholder="Untitled"
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Markdown Document</span>
              <span>•</span>
              <span>{isSaving ? "Saving..." : "Saved"}</span>
              <span>•</span>
              <span>{blocks.reduce((acc, b) => acc + (b.content.split('\n').length), 0)} lines</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Add block controls, formatting tools can be added per block */}
            <button className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      {/* Block-based Editor Content */}
      <div className="flex-1 flex overflow-y-auto">
        <div className="flex-1 p-6 space-y-4">
          {blocks.map((block, idx) => (
            <div key={block.id} className="group relative bg-white/70 dark:bg-gray-800/70 rounded-2xl clay-element p-4 flex flex-col">
              {/* Block controls */}
              <div className="absolute left-0 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-blue-500"><span>&uarr;</span></button>
                <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className="text-gray-400 hover:text-blue-500"><span>&darr;</span></button>
                <button onClick={() => deleteBlock(idx)} className="text-gray-400 hover:text-red-500"><span>&times;</span></button>
              </div>
              {/* Markdown block editor */}
              {block.type === 'markdown' && (
                <>
                  <textarea
                    ref={el => blockRefs.current[block.id] = el}
                    value={block.content}
                    onChange={e => updateBlockContent(idx, e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-2 resize-none"
                    placeholder="Type markdown..."
                    rows={Math.max(2, block.content.split('\n').length)}
                  />
                  <div className="prose prose-sm dark:prose-invert max-w-none border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                  </div>
                </>
              )}
              {/* Add more block types here in the future */}
            </div>
          ))}
          <button
            className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/30 dark:to-blue-900/30 clay-element text-center text-gray-700 dark:text-gray-300 font-medium hover:scale-105 transition-transform"
            onClick={addBlock}
          >
            + Add Block
          </button>
        </div>
      </div>
    </div>
  );

  // --- Block manipulation helpers ---
  function updateBlockContent(idx, value) {
    setBlocks(blocks => blocks.map((b, i) => i === idx ? { ...b, content: value } : b));
  }
  function addBlock() {
    setBlocks(blocks => [...blocks, { id: Date.now().toString() + Math.random(), type: 'markdown', content: '' }]);
  }
  function deleteBlock(idx) {
    setBlocks(blocks => blocks.length > 1 ? blocks.filter((_, i) => i !== idx) : blocks);
  }
  function moveBlock(idx, dir) {
    setBlocks(blocks => {
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(idx, 1);
      newBlocks.splice(idx + dir, 0, removed);
      return newBlocks;
    });
  }
}