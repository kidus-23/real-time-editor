import React from "react";
import { 
  Play, 
  Star, 
  Users, 
  Clock,
  MoreHorizontal,
  Zap
} from "lucide-react";

export default function TemplateCard({ template, onUse }) {
  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700",
      purple: "from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700",
      green: "from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700",
      orange: "from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700",
      yellow: "from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700",
      indigo: "from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 border-indigo-200 dark:border-indigo-700",
      pink: "from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-700"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-105 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-16 h-16 rounded-3xl bg-gradient-to-br ${getColorClasses(template.color)} 
          border-2 clay-element flex items-center justify-center text-2xl
        `}>
          {template.icon}
        </div>
        
        <div className="flex items-center gap-2">
          {template.isBuiltIn && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium clay-inner">
              <Zap className="w-3 h-3" />
              Featured
            </div>
          )}
          
          <button className="w-8 h-8 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">
          {template.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-4">
          {template.usageCount && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{template.usageCount} uses</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>5 min setup</span>
          </div>
        </div>
        
        {template.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{template.rating}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onUse(template)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-3xl bg-gradient-to-r from-purple-400 to-blue-400 text-white clay-element font-semibold hover:scale-105 transition-transform duration-300"
      >
        <Play className="w-4 h-4" />
        Use Template
      </button>
    </div>
  );
}