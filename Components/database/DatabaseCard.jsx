
import React from "react";
import { format } from "date-fns";
import { 
  Database, 
  Table,
  Calendar,
  KanbanSquare, // Changed from LayoutBoard to KanbanSquare
  Grid3X3,
  Users, 
  Clock,
  MoreHorizontal,
  Share2
} from "lucide-react";

export default function DatabaseCard({ database, onOpen }) {
  const getViewIcon = (viewType) => {
    switch (viewType) {
      case "table": return Table;
      case "board": return KanbanSquare; // Changed from LayoutBoard to KanbanSquare
      case "calendar": return Calendar;
      case "gallery": return Grid3X3;
      default: return Table;
    }
  };

  const getSchemaFieldCount = () => {
    if (!database.schema || !database.schema.properties) return 0;
    return Object.keys(database.schema.properties).length;
  };

  return (
    <div 
      onClick={onOpen}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-105 transition-all duration-300 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 clay-element flex items-center justify-center">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Handle more options
          }}
          className="w-8 h-8 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
          {database.name}
        </h3>
        
        {database.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed mb-3">
            {database.description}
          </p>
        )}

        {/* Schema Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-medium clay-inner">
            {getSchemaFieldCount()} fields
          </span>
          
          {database.views && database.views.length > 0 && (
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-2xl text-xs font-medium clay-inner">
              {database.views.length} views
            </span>
          )}
        </div>

        {/* Views */}
        {database.views && database.views.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {database.views.slice(0, 3).map((view, index) => {
              const ViewIcon = getViewIcon(view.type);
              return (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-xs clay-inner"
                >
                  <ViewIcon className="w-3 h-3" />
                  <span>{view.name}</span>
                </div>
              );
            })}
            {database.views.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{database.views.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{format(new Date(database.updated_date || database.created_date), "MMM d")}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {database.collaborators && database.collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{database.collaborators.length + 1}</span>
            </div>
          )}
          
          {database.is_public && (
            <Share2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          )}
        </div>
      </div>
    </div>
  );
}
