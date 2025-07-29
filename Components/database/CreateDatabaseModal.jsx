
import React, { useState } from "react";
import { X, Plus, Trash2, Table, KanbanSquare, Calendar, Grid3X3 } from "lucide-react";

export default function CreateDatabaseModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title"
        }
      },
      required: ["title"]
    },
    views: [
      {
        name: "All Items",
        type: "table",
        filters: {},
        sorts: []
      }
    ],
    is_public: false
  });

  const [newField, setNewField] = useState({ name: "", type: "string", description: "" });

  const fieldTypes = [
    { value: "string", label: "Text", example: "Short text" },
    { value: "number", label: "Number", example: "123" },
    { value: "boolean", label: "Checkbox", example: "true/false" },
    { value: "date", label: "Date", example: "2024-01-01" },
    { value: "array", label: "Multi-select", example: "Tag 1, Tag 2" },
    { value: "object", label: "Object", example: "Complex data" }
  ];

  const viewTypes = [
    { value: "table", label: "Table", icon: Table, description: "Spreadsheet-like view" },
    { value: "board", label: "Board", icon: KanbanSquare, description: "Kanban board view" },
    { value: "calendar", label: "Calendar", icon: Calendar, description: "Calendar timeline" },
    { value: "gallery", label: "Gallery", icon: Grid3X3, description: "Card gallery view" }
  ];

  const addField = () => {
    if (newField.name.trim()) {
      const fieldKey = newField.name.toLowerCase().replace(/\s+/g, '_');
      setFormData(prev => ({
        ...prev,
        schema: {
          ...prev.schema,
          properties: {
            ...prev.schema.properties,
            [fieldKey]: {
              type: newField.type,
              description: newField.description || newField.name
            }
          }
        }
      }));
      setNewField({ name: "", type: "string", description: "" });
    }
  };

  const removeField = (fieldKey) => {
    if (fieldKey === "title") return; // Don't allow removing the title field
    
    setFormData(prev => {
      const newProperties = { ...prev.schema.properties };
      delete newProperties[fieldKey];
      return {
        ...prev,
        schema: {
          ...prev.schema,
          properties: newProperties
        }
      };
    });
  };

  const addView = (viewType) => {
    const viewName = `${viewType.charAt(0).toUpperCase() + viewType.slice(1)} View`;
    setFormData(prev => ({
      ...prev,
      views: [
        ...prev.views,
        {
          name: viewName,
          type: viewType,
          filters: {},
          sorts: []
        }
      ]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl clay-element p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create Database</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center transition-colors duration-300"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Database Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter database name..."
                className="w-full p-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your database..."
                className="w-full p-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Schema Fields */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Database Fields
            </label>
            
            {/* Existing Fields */}
            <div className="space-y-2 mb-4">
              {Object.entries(formData.schema.properties).map(([key, field]) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl clay-inner">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{field.description}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">({field.type})</span>
                  </div>
                  
                  {key !== "title" && (
                    <button
                      type="button"
                      onClick={() => removeField(key)}
                      className="w-8 h-8 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 clay-button flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Field name..."
                className="flex-1 p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
              />
              
              <select
                value={newField.type}
                onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                className="p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={addField}
                className="px-4 py-3 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 clay-button font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Views */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Database Views
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {viewTypes.map((viewType) => (
                <button
                  key={viewType.value}
                  type="button"
                  onClick={() => addView(viewType.value)}
                  disabled={formData.views.some(v => v.type === viewType.value)}
                  className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 clay-button transition-all duration-300 text-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <viewType.icon className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">{viewType.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{viewType.description}</div>
                </button>
              ))}
            </div>

            {/* Current Views */}
            <div className="space-y-2">
              {formData.views.map((view, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl clay-inner">
                  <div className="flex-1">
                    <span className="font-medium text-blue-800 dark:text-blue-200">{view.name}</span>
                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 capitalize">({view.type})</span>
                  </div>
                </div>
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
              Make this database public (team members can access)
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
              Create Database
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
