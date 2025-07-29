import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Code, 
  BookOpen, 
  Palette, 
  Users, 
  Clock,
  MoreHorizontal,
  Share2
} from "lucide-react";

export default function DocumentCard({ document, typeColor }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case "code": return Code;
      case "research": return BookOpen;
      case "whiteboard": return Palette;
      default: return FileText;
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: "from-green-100 to-green-200 border-green-200",
      orange: "from-orange-100 to-orange-200 border-orange-200", 
      blue: "from-blue-100 to-blue-200 border-blue-200",
      purple: "from-purple-100 to-purple-200 border-purple-200",
      gray: "from-gray-100 to-gray-200 border-gray-200"
    };
    return colors[color] || colors.gray;
  };

  const TypeIcon = getTypeIcon(document.type);

  return (
    <Link to={createPageUrl(`Editor?id=${document.id}`)} className="group">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl clay-element p-6 hover:scale-105 transition-all duration-300 h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`
            w-12 h-12 rounded-2xl bg-gradient-to-br ${getColorClasses(typeColor)} 
            border-2 clay-element flex items-center justify-center
          `}>
            <TypeIcon className={`w-6 h-6 text-${typeColor}-600`} />
          </div>
          
          <button className="w-8 h-8 rounded-xl hover:bg-gray-100 clay-button flex items-center justify-center transition-colors duration-300">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
            {document.title}
          </h3>
          
          {document.content && (
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
              {document.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
          )}
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-xl text-xs font-medium clay-inner"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium clay-inner">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(document.updated_date), "MMM d")}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {document.collaborators && document.collaborators.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{document.collaborators.length + 1}</span>
              </div>
            )}
            
            {document.is_public && (
              <Share2 className="w-4 h-4 text-blue-500" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}