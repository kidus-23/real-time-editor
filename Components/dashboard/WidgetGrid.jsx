import React from "react";
import { Plus, MoreHorizontal } from "lucide-react";

export default function WidgetGrid({ widgets }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Widgets</h3>
        <button className="w-8 h-8 rounded-2xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {widgets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No widgets configured</p>
          <button className="px-4 py-2 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 clay-button font-medium">
            Add Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 clay-inner">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{widget.title}</h4>
                <button className="w-6 h-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{widget.type} widget</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}