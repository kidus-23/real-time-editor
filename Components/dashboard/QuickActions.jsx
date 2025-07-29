import React from "react";
import { Link } from "react-router-dom";

export default function QuickActions({ actions }) {
  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-100/80 to-blue-200/80 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200/50 dark:border-blue-700/30 text-blue-700 dark:text-blue-300",
      green: "from-green-100/80 to-green-200/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200/50 dark:border-green-700/30 text-green-700 dark:text-green-300",
      purple: "from-purple-100/80 to-purple-200/80 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200/50 dark:border-purple-700/30 text-purple-700 dark:text-purple-300",
      orange: "from-orange-100/80 to-orange-200/80 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200/50 dark:border-orange-700/30 text-orange-700 dark:text-orange-300"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.title}
          to={action.url}
          className="group"
        >
          <div className={`
            p-6 rounded-3xl clay-element clay-button
            bg-gradient-to-br ${getColorClasses(action.color)}
            border-2 hover:scale-105 transition-all duration-300
          `}>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-white/60 dark:bg-gray-800/60 clay-inner flex items-center justify-center">
                <action.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{action.title}</h3>
                <p className="text-sm opacity-80 mt-1">{action.description}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}