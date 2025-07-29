import React from "react";
import { Clock, FileText, Database, MessageSquare } from "lucide-react";

export default function RecentActivity() {
  const activities = [
    { type: "page", title: "Updated project notes", time: "2 hours ago", icon: FileText },
    { type: "comment", title: "New comment on design doc", time: "4 hours ago", icon: MessageSquare },
    { type: "database", title: "Added tasks to project board", time: "1 day ago", icon: Database }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Recent Activity</h3>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors clay-button">
            <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-900/50 clay-inner flex items-center justify-center">
              <activity.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}