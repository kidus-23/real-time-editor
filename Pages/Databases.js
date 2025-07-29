
import React, { useState, useEffect } from "react";
import { Database, User } from "@/entities/all";
import {
  Database as DatabaseIcon,
  Plus,
  Search,
  Filter,
  Table,
  Calendar,
  KanbanSquare, // Changed from LayoutBoard to KanbanSquare
  Grid3X3,
  MoreHorizontal,
  Users,
  Clock,
  Share2
} from "lucide-react";
import { format } from "date-fns";

import DatabaseCard from "../components/databases/DatabaseCard";
import CreateDatabaseModal from "../components/databases/CreateDatabaseModal";
import DatabaseViews from "../components/databases/DatabaseViews";

export default function Databases() {
  const [databases, setDatabases] = useState([]);
  const [filteredDatabases, setFilteredDatabases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadDatabases();
  }, []);

  useEffect(() => {
    filterDatabases();
  }, [databases, searchQuery, selectedView]);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadDatabases = async () => {
    try {
      const allDatabases = await Database.list("-updated_date");
      setDatabases(allDatabases);
    } catch (error) {
      console.error("Error loading databases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDatabases = () => {
    let filtered = databases;

    if (searchQuery.trim()) {
      filtered = filtered.filter(db =>
        db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        db.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedView !== "all") {
      filtered = filtered.filter(db =>
        db.views?.some(view => view.type === selectedView)
      );
    }

    setFilteredDatabases(filtered);
  };

  const handleCreateDatabase = async (dbData) => {
    try {
      const newDatabase = await Database.create({
        ...dbData,
        created_by: user?.email
      });
      setDatabases(prev => [newDatabase, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating database:", error);
    }
  };

  const viewTypes = [
    { value: "all", label: "All Views", icon: DatabaseIcon, color: "gray" },
    { value: "table", label: "Table", icon: Table, color: "blue" },
    { value: "board", label: "Board", icon: KanbanSquare, color: "green" }, // Icon changed to KanbanSquare
    { value: "calendar", label: "Calendar", icon: Calendar, color: "purple" },
    { value: "gallery", label: "Gallery", icon: Grid3X3, color: "orange" }
  ];

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

  if (selectedDatabase) {
    return (
      <DatabaseViews
        database={selectedDatabase}
        onBack={() => setSelectedDatabase(null)}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Databases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {databases.length} databases • {filteredDatabases.length} showing
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-3xl clay-element clay-button font-semibold hover:scale-105 transition-transform duration-300"
        >
          <Plus className="w-5 h-5" />
          New Database
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
              placeholder="Search databases..."
              className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {viewTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedView(type.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-3xl transition-all duration-300 whitespace-nowrap clay-button
                  ${selectedView === type.value
                    ? `bg-${type.color}-100 dark:bg-${type.color}-900/50 text-${type.color}-700 dark:text-${type.color}-300 clay-element`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <type.icon className="w-4 h-4" />
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Databases Grid */}
      {filteredDatabases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatabases.map((database) => (
            <DatabaseCard
              key={database.id}
              database={database}
              onOpen={() => setSelectedDatabase(database)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-6">
              <DatabaseIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {searchQuery ? "No databases found" : "No databases yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first database to get started"
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-3xl clay-button font-semibold hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Database
            </button>
          </div>
        </div>
      )}

      {/* Create Database Modal */}
      {showCreateModal && (
        <CreateDatabaseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDatabase}
        />
      )}
    </div>
  );
}
