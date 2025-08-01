import React, { useState, useEffect } from "react";
import { Page, Widget, User } from "@/entities/all";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Plus, 
  Calendar, 
  CheckSquare, 
  TrendingUp,
  Users,
  Database,
  Palette,
  Share2,
  Zap,
  ArrowRight,
  Grid3X3
} from "lucide-react";
import { format } from "date-fns";

import QuickActions from "../components/dashboard/QuickActions";
import WidgetGrid from "../components/dashboard/WidgetGrid";
import RecentActivity from "../components/dashboard/RecentActivity";

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userInfo, recentPages, userWidgets] = await Promise.all([
        User.me(),
        Page.list("-updated_date", 8),
        Widget.list("-created_date")
      ]);
      
      setUser(userInfo);
      setPages(recentPages);
      setWidgets(userWidgets);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: "New Page",
      description: "Create a new page",
      icon: FileText,
      color: "blue",
      url: createPageUrl("PageEditor?new=true")
    },
    {
      title: "Database",
      description: "Create a database",
      icon: Database,
      color: "green",
      url: createPageUrl("DatabaseEditor?new=true")
    },
    {
      title: "Whiteboard",
      description: "Visual brainstorming",
      icon: Palette,
      color: "purple",
      url: createPageUrl("Whiteboard")
    },
    {
      title: "Template",
      description: "Use a template",
      icon: Grid3X3,
      color: "orange",
      url: createPageUrl("Templates")
    }
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-white/50 dark:bg-gray-800/50 rounded-3xl clay-element animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-100/80 via-blue-100/80 to-green-100/80 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-green-900/30 rounded-3xl clay-element p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Ready to organize your knowledge and collaborate?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 clay-element flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Pages */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Recent Pages</h3>
              <Link 
                to={createPageUrl("Pages")}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {pages.slice(0, 6).map((page) => (
                <Link
                  key={page.id}
                  to={createPageUrl(`PageEditor?id=${page.id}`)}
                  className="block p-4 rounded-3xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 clay-button group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 clay-element flex items-center justify-center text-2xl">
                      {page.icon || '📄'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {page.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Updated {format(new Date(page.updated_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              
              {pages.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No pages yet</p>
                  <Link
                    to={createPageUrl("PageEditor?new=true")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-3xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 clay-button font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create your first page
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-blue-100 dark:bg-blue-900/50 clay-inner flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Pages</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">{pages.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-green-100 dark:bg-green-900/50 clay-inner flex items-center justify-center">
                    <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Databases</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-900/50 clay-inner flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Connections</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-gradient-to-br from-purple-100/80 to-blue-100/80 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl clay-element p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 clay-element flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">AI Assistant</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Get AI-powered suggestions and content generation to boost your productivity.
            </p>
            <button className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-700/50 text-purple-700 dark:text-purple-300 clay-button font-medium hover:bg-white dark:hover:bg-gray-600/50 transition-colors">
              Ask AI Assistant
            </button>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}