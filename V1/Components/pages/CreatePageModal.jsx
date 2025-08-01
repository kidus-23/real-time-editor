import React, { useState } from "react";
import { X, FileText, Database, Palette, Grid3X3, BookOpen } from "lucide-react";

export default function CreatePageModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    icon: "📄",
    template: "blank",
    is_public: false
  });

  const templates = [
    { 
      value: "blank", 
      label: "Blank Page", 
      icon: FileText, 
      description: "Start with an empty page",
      color: "blue"
    },
    { 
      value: "note", 
      label: "Note", 
      icon: BookOpen, 
      description: "Simple note-taking template",
      color: "green"
    },
    { 
      value: "project", 
      label: "Project", 
      icon: Grid3X3, 
      description: "Project planning template",
      color: "purple"
    },
    { 
      value: "database", 
      label: "Database", 
      icon: Database, 
      description: "Structured data collection",
      color: "orange"
    },
    { 
      value: "whiteboard", 
      label: "Whiteboard", 
      icon: Palette, 
      description: "Visual brainstorming space",
      color: "pink"
    }
  ];

  const emojis = ["📄", "📝", "📊", "🎨", "💡", "🚀", "📈", "🔬", "📚", "🎯"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreate(formData);
    }
  };

  const getColorClasses = (color, selected = false) => {
    const colors = {
      blue: selected ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700',
      green: selected ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300' : 'hover:bg-green-50 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700',
      purple: selected ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300' : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700',
      orange: selected ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300' : 'hover:bg-orange-50 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-700',
      pink: selected ? 'bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-600 text-pink-700 dark:text-pink-300' : 'hover:bg-pink-50 dark:hover:bg-pink-900/30 border-pink-200 dark:border-pink-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl clay-element p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create New Page</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center transition-colors duration-300"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title and Icon */}
          <div className="flex gap-4">
            <div className="w-16">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Icon
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 clay-inner flex items-center justify-center text-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {formData.icon}
                </button>
                <div className="absolute top-16 left-0 bg-white dark:bg-gray-800 rounded-2xl clay-element p-2 grid grid-cols-5 gap-1 opacity-0 hover:opacity-100 transition-opacity z-10">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Page Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter page title..."
                className="w-full p-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Choose Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, template: template.value }))}
                  className={`
                    p-4 rounded-3xl border-2 clay-button transition-all duration-300 text-left
                    ${getColorClasses(template.color, formData.template === template.value)}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <template.icon className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="font-semibold">{template.label}</h3>
                      <p className="text-sm opacity-80 mt-1">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-5 h-5 rounded clay-element"
            />
            <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Make this page public (team members can access)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-3xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 clay-button font-semibold transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-3xl bg-gradient-to-r from-purple-400 to-blue-400 text-white clay-element font-semibold hover:scale-105 transition-transform duration-300"
            >
              Create Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}