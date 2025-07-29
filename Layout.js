
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Palette, 
  Code, 
  Bell, 
  Users,
  Settings,
  Home,
  Lightbulb,
  MessageSquare,
  Moon,
  Sun,
  Database,
  Share2,
  Grid3X3
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else if (systemPrefersDark) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Home,
      color: "lavender"
    },
    {
      title: "Pages",
      url: createPageUrl("Pages"),
      icon: FileText,
      color: "mint"
    },
    {
      title: "Databases",
      url: createPageUrl("Databases"),  
      icon: Database,
      color: "blue"
    },
    {
      title: "Templates",
      url: createPageUrl("Templates"),
      icon: Grid3X3,
      color: "orange"
    },
    {
      title: "Whiteboard",
      url: createPageUrl("Whiteboard"),
      icon: Palette,
      color: "peach"
    },
    {
      title: "Code Lab",
      url: createPageUrl("CodeLab"),
      icon: Code,
      color: "purple"
    },
    {
      title: "Graph View",
      url: createPageUrl("GraphView"),
      icon: Share2,
      color: "pink"
    }
  ];

  const getColorClasses = (color, isActive = false) => {
    const colors = {
      lavender: isActive 
        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-purple-200/50 dark:shadow-purple-800/30' 
        : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400',
      mint: isActive 
        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-green-200/50 dark:shadow-green-800/30' 
        : 'hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400',
      blue: isActive 
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-blue-200/50 dark:shadow-blue-800/30' 
        : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400',
      peach: isActive 
        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 shadow-orange-200/50 dark:shadow-orange-800/30' 
        : 'hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400',
      purple: isActive 
        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-purple-200/50 dark:shadow-purple-800/30' 
        : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400',
      pink: isActive 
        ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 shadow-pink-200/50 dark:shadow-pink-800/30' 
        : 'hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400',
      orange: isActive 
        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 shadow-orange-200/50 dark:shadow-orange-800/30' 
        : 'hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400'
    };
    return colors[color] || colors.lavender;
  };

  return (
    <div className="min-h-screen bg-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:bg-gradient-to-br transition-all duration-500">
      <style>{`
        :root {
          --clay-shadow: 8px 16px 40px -8px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.8);
          --clay-shadow-inner: inset 4px 4px 12px rgba(0, 0, 0, 0.05), inset -4px -4px 12px rgba(255, 255, 255, 0.9);
          --clay-hover: 12px 20px 50px -8px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.9);
        }
        
        .dark {
          --clay-shadow: 8px 16px 40px -8px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
          --clay-shadow-inner: inset 4px 4px 12px rgba(0, 0, 0, 0.3), inset -4px -4px 12px rgba(255, 255, 255, 0.05);
          --clay-hover: 12px 20px 50px -8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
        }
        
        .clay-element {
          box-shadow: var(--clay-shadow);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .clay-element:hover {
          box-shadow: var(--clay-hover);
          transform: translateY(-3px);
        }
        
        .clay-inner {
          box-shadow: var(--clay-shadow-inner);
        }
        
        .clay-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .clay-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }
        
        .clay-button:hover::before {
          left: 100%;
        }
        
        .clay-button:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 dark:bg-white-800/80 backdrop-blur-2xl clay-element border-r border-gray-200/50 dark:border-gray-700/30 z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 clay-element flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">KnowFlow</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Knowledge Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-300
                  clay-button relative overflow-hidden text-gray-700 dark:text-gray-300
                  ${getColorClasses(item.color, isActive)}
                  ${isActive ? 'clay-element' : ''}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 clay-button text-gray-700 dark:text-gray-300"
          >
            {isDark ? (
              <>
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Dark Mode</span>
              </>
            )}
          </button>
          
          <Link
            to={createPageUrl("Settings")}
            className="flex items-center gap-3 px-4 py-3 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 clay-button text-gray-700 dark:text-gray-300"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          
          <div className="flex items-center gap-3 px-4 py-3 rounded-3xl bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/30 dark:to-blue-900/30 clay-element">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">3 online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-800/80 backdrop-blur-2xl clay-element border-b border-gray-200/50 dark:border-gray-700/30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {currentPageName}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="w-11 h-11 rounded-3xl bg-orange-100/80 dark:bg-orange-900/50 clay-element flex items-center justify-center hover:bg-orange-200/80 dark:hover:bg-orange-800/50 transition-colors duration-300">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </button>
              
              <button className="w-11 h-11 rounded-3xl bg-green-100/80 dark:bg-green-900/50 clay-element flex items-center justify-center hover:bg-green-200/80 dark:hover:bg-green-800/50 transition-colors duration-300">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </button>
              
              <div className="w-11 h-11 rounded-3xl bg-gradient-to-r from-purple-400 to-blue-400 clay-element flex items-center justify-center">
                <span className="text-white font-semibold text-sm">U</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen bg-white dark:bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
