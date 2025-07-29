import React, { useState, useEffect } from "react";
import { Document, User } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Users,
  Clock,
  Code,
  BookOpen,
  Palette,
  Share2
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import DocumentCard from "../components/documents/DocumentCard";
import CreateDocumentModal from "../components/documents/CreateDocumentModal";
import SearchBar from "../components/documents/SearchBar";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDocuments();
    loadUser();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedType]);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await Document.list("-updated_date");
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = async () => {
    let filtered = documents;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      if (searchQuery.length > 2) {
        try {
          // Use AI semantic search for better results
          const searchResult = await InvokeLLM({
            prompt: `Search for documents that match this query: "${searchQuery}". 
                     Documents to search through: ${JSON.stringify(documents.map(d => ({
                       id: d.id, 
                       title: d.title, 
                       content: d.content?.substring(0, 200),
                       tags: d.tags
                     })))}
                     
                     Return the IDs of documents that semantically match the search query, ranked by relevance.`,
            response_json_schema: {
              type: "object",
              properties: {
                document_ids: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          });

          const relevantIds = searchResult.document_ids || [];
          filtered = documents.filter(doc => relevantIds.includes(doc.id));
        } catch (error) {
          // Fallback to simple text search
          filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
      } else {
        // Simple text search for short queries
        filtered = filtered.filter(doc => 
          doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }

    setFilteredDocuments(filtered);
  };

  const handleCreateDocument = async (docData) => {
    try {
      const newDoc = await Document.create({
        ...docData,
        created_by: user?.email,
        last_edited_by: user?.email
      });
      setDocuments(prev => [newDoc, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const documentTypes = [
    { value: "all", label: "All Documents", icon: FileText, color: "gray" },
    { value: "document", label: "Documents", icon: FileText, color: "green" },
    { value: "code", label: "Code", icon: Code, color: "orange" },
    { value: "research", label: "Research", icon: BookOpen, color: "blue" },
    { value: "whiteboard", label: "Whiteboards", icon: Palette, color: "purple" }
  ];

  const getTypeColor = (type) => {
    const typeInfo = documentTypes.find(t => t.value === type);
    return typeInfo?.color || "gray";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-white/50 rounded-3xl clay-element animate-pulse" />
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
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          <p className="text-gray-600 mt-1">
            {documents.length} documents • {filteredDocuments.length} showing
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-2xl clay-element clay-button font-semibold hover:scale-105 transition-transform duration-300"
        >
          <Plus className="w-5 h-5" />
          New Document
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl clay-element p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search documents with AI..."
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {documentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 whitespace-nowrap clay-button
                  ${selectedType === type.value 
                    ? `bg-${type.color}-100 text-${type.color}-700 clay-element` 
                    : 'hover:bg-gray-100 text-gray-600'
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

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <DocumentCard 
              key={document.id} 
              document={document}
              typeColor={getTypeColor(document.type)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl clay-element p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 clay-element flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? "Try adjusting your search terms or filters"
                : "Start creating your knowledge base"
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-2xl clay-button font-semibold hover:bg-purple-200 transition-colors duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Document
            </button>
          </div>
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDocument}
        />
      )}
    </div>
  );
}