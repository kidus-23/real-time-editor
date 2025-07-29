import React, { useState } from "react";
import { X, FileText, Code, BookOpen, Palette, Target, Briefcase } from "lucide-react";

export default function CreateTemplateModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "productivity",
    icon: "📝",
    color: "blue",
    isPublic: false
  });

  const categories = [
    { value: "productivity", label: "Productivity", icon: FileText, color: "blue" },
    { value: "project", label: "Project Management", icon: Target, color: "purple" },
    { value: "research", label: "Research", icon: BookOpen, color: "green" },
    { value: "technical", label: "Technical", icon: Code, color: "orange" },
    { value: "product", label: "Product", icon: Briefcase, color: "indigo" },
    { value: "creative", label: "Creative", icon: Palette, color: "pink" }
  ];

  const colors = ["blue", "purple", "green", "orange", "yellow", "indigo", "pink"];
  const emojis = ["📝", "📊", "🎯", "💡", "🚀", "📚", "🎨", "⚡", "🔬", "📈"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl clay-element p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create Template</h2>
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
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 clay-inner flex items-center justify-center text-2xl cursor-pointer">
                {formData.icon}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                    className="w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Template Name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter template name..."
                className="w-full p-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for..."
              rows={3}
              className="w-full p-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                  className={`
                    p-3 rounded-2xl border-2 clay-button transition-all duration-300 text-left
                    ${formData.category === category.value
                      ? `bg-${category.color}-100 dark:bg-${category.color}-900/50 border-${category.color}-300 dark:border-${category.color}-600 text-${category.color}-700 dark:text-${category.color}-300`
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Color Theme
            </label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`
                    w-8 h-8 rounded-2xl clay-element border-2 transition-transform duration-200
                    bg-${color}-200 dark:bg-${color}-800
                    ${formData.color === color ? 'scale-110 border-gray-400 dark:border-gray-500' : 'border-gray-200 dark:border-gray-600'}
                  `}
                />
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="w-5 h-5 rounded clay-element"
            />
            <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Make this template public (others can discover and use it)
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
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}