import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Users, 
  Clock,
  MoreHorizontal,
  Share2
} from "lucide-react";

export default function PageCard({ page, viewMode = "grid" }) {
  if (viewMode === "list") {
    return (
      <Link to={createPageUrl(`PageEditor?id=${page.id}`)} className="group">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-102 transition-all duration-300 flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 clay-element flex items-center justify-center text-3xl">
            {page.icon || '📄'}
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
              {page.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(page.updated_date), "MMM d, yyyy")}</span>
              </div>
              
              {page.collaborators && page.collaborators.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{page.collaborators.length + 1} collaborators</span>
                </div>
              )}
              
              {page.is_public && (
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400">Public</span>
                </div>
              )}
            </div>
          </div>
          
          <button className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link to={createPageUrl(`PageEditor?id=${page.id}`)} className="group">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-105 transition-all duration-300 h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 clay-element flex items-center justify-center text-3xl">
            {page.icon || '📄'}
          </div>
          
          <button className="w-8 h-8 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {page.title}
          </h3>
          
          <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl text-sm font-medium clay-inner capitalize">
            {page.template || 'page'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(page.updated_date), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {page.collaborators && page.collaborators.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{page.collaborators.length + 1}</span>
              </div>
            )}
            
            {page.is_public && (
              <Share2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}