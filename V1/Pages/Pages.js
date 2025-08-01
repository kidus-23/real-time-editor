import React, { useState, useEffect } from "react";
import { Page, User } from "@/entities/all";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Share2,
  Calendar,
  Grid,
  List
} from "lucide-react";
import { format } from "date-fns";

import PageCard from "../components/pages/PageCard";
import CreatePageModal from "../components/pages/CreatePageModal";

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPages();
    loadUser();
  }, []);

  useEffect(() => {
    filterPages();
  }, [pages, searchQuery]);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadPages = async () => {
    try {
      const allPages = await Page.list("-updated_date");
      setPages(allPages);
    } catch (error) {
      console.error("Error loading pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPages = () => {
    let filtered = pages;

    if (searchQuery.trim()) {
      filtered = filtered.filter(page => 
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPages(filtered);
  };

  const handleCreatePage = async (pageData) => {
    try {
      const newPage = await Page.create({
        ...pageData,
        created_by: user?.email
      });
      setPages(prev => [newPage, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating page:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white/50 dark:bg-gray-800/50 rounded-3xl clay-element animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Pages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pages.length} pages • {filteredPages.length} showing
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-3xl clay-element clay-button font-semibold hover:scale-105 transition-transform duration-300"
        >
          <Plus className="w-5 h-5" />
          New Page
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`
                w-12 h-12 rounded-2xl clay-button flex items-center justify-center transition-colors
                ${viewMode === "grid" 
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              <Grid className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode("list")}
              className={`
                w-12 h-12 rounded-2xl clay-button flex items-center justify-center transition-colors
                ${viewMode === "list" 
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pages Grid/List */}
      {filteredPages.length > 0 ? (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredPages.map((page) => (
            <PageCard 
              key={page.id} 
              page={page}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {searchQuery ? "No pages found" : "No pages yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Create your first page to get started"
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-3xl clay-button font-semibold hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Page
            </button>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePage}
        />
      )}
    </div>
  );
}