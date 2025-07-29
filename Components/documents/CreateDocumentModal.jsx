import React, { useState } from "react";
import { X, FileText, Code, BookOpen, Palette } from "lucide-react";

export default function CreateDocumentModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "document",
    content: "",
    tags: [],
    is_public: false
  });
  const [tagInput, setTagInput] = useState("");

  const documentTypes = [
    { 
      value: "document", 
      label: "Document", 
      icon: FileText, 
      description: "Rich text document for notes and ideas",
      color: "green"
    },
    { 
      value: "code", 
      label: "Code Lab", 
      icon: Code, 
      description: "Code snippets and programming notes",
      color: "orange"
    },
    { 
      value: "research", 
      label: "Research", 
      icon: BookOpen, 
      description: "Academic research and citations",
      color: "blue"
    },
    { 
      value: "whiteboard", 
      label: "Whiteboard", 
      icon: Palette, 
      description: "Visual collaboration space",
      color: "purple"
    }
  ];

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreate(formData);
    }
  };

  const getColorClasses = (color, selected = false) => {
    const colors = {
      green: selected ? 'bg-green-100 border-green-300 text-green-700' : 'hover:bg-green-50 border-green-200',
      orange: selected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'hover:bg-orange-50 border-orange-200',
      blue: selected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'hover:bg-blue-50 border-blue-200',
      purple: selected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'hover:bg-purple-50 border-purple-200'
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl clay-element p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Document</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-gray-100 clay-button flex items-center justify-center transition-colors duration-300"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter document title..."
              className="w-full p-4 rounded-2xl border-2 border-gray-200 clay-inner focus:border-purple-300 focus:outline-none transition-colors duration-300"
              required
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Document Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`
                    p-4 rounded-2xl border-2 clay-button transition-all duration-300 text-left
                    ${getColorClasses(type.color, formData.type === type.value)}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <type.icon className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm opacity-80 mt-1">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter..."
              className="w-full p-4 rounded-2xl border-2 border-gray-200 clay-inner focus:border-purple-300 focus:outline-none transition-colors duration-300"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-xl text-sm clay-inner"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-purple-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
              Make this document public (team members can access)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 clay-button font-semibold transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 text-white clay-element font-semibold hover:scale-105 transition-transform duration-300"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}