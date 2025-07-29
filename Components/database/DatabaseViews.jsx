
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Table,
  KanbanSquare, // Changed from LayoutBoard
  Calendar,
  Grid3X3,
  Plus,
  Filter,
  ArrowUpDown, // Changed from Sort
  Search,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";

export default function DatabaseViews({ database, onBack }) {
  const [currentView, setCurrentView] = useState(database.views?.[0] || { type: "table", name: "Table View" });
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddRecord, setShowAddRecord] = useState(false);

  useEffect(() => {
    // Load sample data based on schema
    loadSampleData();
  }, [database]);

  const loadSampleData = () => {
    // Generate sample data based on the schema
    const sampleData = [
      {
        id: "1",
        title: "Sample Task",
        status: "In Progress",
        priority: "High",
        created_date: new Date().toISOString()
      },
      {
        id: "2", 
        title: "Another Item",
        status: "Todo",
        priority: "Medium",
        created_date: new Date().toISOString()
      }
    ];
    setData(sampleData);
  };

  const getViewIcon = (viewType) => {
    switch (viewType) {
      case "table": return Table;
      case "board": return KanbanSquare; // Changed from LayoutBoard
      case "calendar": return Calendar;
      case "gallery": return Grid3X3;
      default: return Table;
    }
  };

  const renderTableView = () => {
    const fields = Object.keys(database.schema.properties);
    
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {fields.map((field) => (
                  <th key={field} className="px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                    {database.schema.properties[field].description || field}
                  </th>
                ))}
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {fields.map((field) => (
                    <td key={field} className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {record[field] || "-"}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <button className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 clay-button flex items-center justify-center">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-4">
              <Table className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No records yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start adding data to your database</p>
            <button
              onClick={() => setShowAddRecord(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-2xl clay-button font-medium"
            >
              <Plus className="w-4 h-4" />
              Add First Record
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBoardView = () => {
    const statusField = Object.keys(database.schema.properties).find(field => 
      field.toLowerCase().includes('status') || field.toLowerCase().includes('stage')
    );

    const statuses = statusField ? ['Todo', 'In Progress', 'Done'] : ['Column 1', 'Column 2', 'Column 3'];

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <div key={status} className="min-w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{status}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {data.filter(item => item.status === status).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {data.filter(item => item.status === status).map((record) => (
                <div key={record.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl clay-inner hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{record.title}</h4>
                  {record.priority && (
                    <span className={`inline-block px-2 py-1 rounded-xl text-xs font-medium ${
                      record.priority === 'High' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                      record.priority === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    }`}>
                      {record.priority}
                    </span>
                  )}
                </div>
              ))}
              
              <button className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors clay-button">
                <Plus className="w-4 h-4 mx-auto mb-1" />
                <span className="text-sm font-medium">Add card</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGalleryView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((record) => (
          <div key={record.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-2xl clay-element mb-4 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{record.title}</h3>
            {record.status && (
              <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-medium">
                {record.status}
              </span>
            )}
          </div>
        ))}
        
        {data.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No items in gallery</h3>
            <p className="text-gray-500 dark:text-gray-400">Add some records to see them here</p>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView.type) {
      case "table":
        return renderTableView();
      case "board":
        return renderBoardView();
      case "gallery":
        return renderGalleryView();
      default:
        return renderTableView();
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{database.name}</h1>
          {database.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{database.description}</p>
          )}
        </div>
        
        <button
          onClick={() => setShowAddRecord(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-2xl clay-element font-semibold hover:scale-105 transition-transform duration-300"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>

      {/* View Tabs and Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {database.views?.map((view) => {
              const ViewIcon = getViewIcon(view.type);
              return (
                <button
                  key={view.name}
                  onClick={() => setCurrentView(view)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 clay-button
                    ${currentView.name === view.name
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 clay-element'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  <ViewIcon className="w-4 h-4" />
                  <span className="font-medium">{view.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-2xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
              />
            </div>
            
            <button className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button className="w-10 h-10 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 clay-button flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" /> {/* Changed from Sort */}
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-96">
        {renderCurrentView()}
      </div>
    </div>
  );
}
