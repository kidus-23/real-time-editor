import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({ searchQuery, onSearchChange, placeholder }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        {searchQuery.length > 2 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">AI</span>
          </div>
        )}
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
      />
    </div>
  );
}