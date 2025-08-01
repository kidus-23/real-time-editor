
import React, { useState, useEffect, useRef } from "react";
import { Page, User } from "@/entities/all";
import { 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  Focus, // Changed from Center to Focus
  Maximize2,
  Settings,
  Share2
} from "lucide-react";

export default function GraphView() {
  const canvasRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      generateGraph();
    }
  }, [pages]);

  const loadGraphData = async () => {
    try {
      const allPages = await Page.list();
      setPages(allPages);
    } catch (error) {
      console.error("Error loading graph data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGraph = () => {
    const graphNodes = pages.map((page, index) => ({
      id: page.id,
      title: page.title,
      icon: page.icon || '📄',
      template: page.template,
      x: Math.cos(index * 0.5) * 200 + 400,
      y: Math.sin(index * 0.5) * 200 + 300,
      connections: []
    }));

    // Generate some sample connections based on similar titles or templates
    const graphLinks = [];
    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const node1 = graphNodes[i];
        const node2 = graphNodes[j];
        
        // Connect nodes with similar templates or titles
        if (
          pages[i].template === pages[j].template ||
          pages[i].title.toLowerCase().includes(pages[j].title.toLowerCase().split(' ')[0]) ||
          Math.random() < 0.3 // Random connections for demo
        ) {
          graphLinks.push({
            source: node1.id,
            target: node2.id,
            strength: Math.random() * 0.5 + 0.5
          });
          node1.connections.push(node2.id);
          node2.connections.push(node1.id);
        }
      }
    }

    setNodes(graphNodes);
    setLinks(graphLinks);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (template) => {
    const colors = {
      blank: '#6B7280',
      note: '#10B981',
      project: '#8B5CF6',
      database: '#F59E0B',
      whiteboard: '#EC4899'
    };
    return colors[template] || colors.blank;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-3xl bg-purple-100 dark:bg-purple-900/50 clay-element animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl clay-element border-r border-white/30 dark:border-gray-700/30 flex flex-col">
        {/* Search */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge graph..."
              className="w-full pl-12 pr-4 py-3 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Graph Controls */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Graph Controls</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setZoom(zoom * 1.2)}
              className="flex items-center gap-2 p-3 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 clay-button"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-sm">Zoom In</span>
            </button>
            
            <button
              onClick={() => setZoom(zoom * 0.8)}
              className="flex items-center gap-2 p-3 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 clay-button"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="text-sm">Zoom Out</span>
            </button>
            
            <button
              onClick={resetView}
              className="flex items-center gap-2 p-3 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 clay-button"
            >
              <Focus className="w-4 h-4" /> {/* Changed from Center to Focus */}
              <span className="text-sm">Center</span>
            </button>
            
            <button className="flex items-center gap-2 p-3 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 clay-button">
              <Maximize2 className="w-4 h-4" />
              <span className="text-sm">Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Node Details */}
        {selectedNode && (
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Selected Node</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedNode.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{selectedNode.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedNode.template}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Connections:</strong> {selectedNode.connections.length}</p>
              </div>
              
              <button className="w-full px-4 py-2 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 clay-button font-medium">
                Open Page
              </button>
            </div>
          </div>
        )}

        {/* Graph Stats */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Graph Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Nodes:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Connections:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{links.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Density:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {nodes.length > 0 ? Math.round((links.length / (nodes.length * (nodes.length - 1) / 2)) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={canvasRef}
          className="w-full h-full bg-white dark:bg-gray-100"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
          }}
        >
          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#D1D5DB"
                strokeWidth={2 * link.strength}
                opacity={0.6}
              />
            );
          })}
          
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={30}
                fill={getNodeColor(node.template)}
                stroke="#FFFFFF"
                strokeWidth="3"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleNodeClick(node)}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-lg font-semibold pointer-events-none"
              >
                {node.icon}
              </text>
              <text
                x={node.x}
                y={node.y + 50}
                textAnchor="middle"
                className="fill-gray-700 dark:fill-gray-300 text-sm font-medium pointer-events-none"
              >
                {node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title}
              </text>
            </g>
          ))}
        </svg>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No Knowledge Graph Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create some pages to see your knowledge connections
              </p>
            </div>
          </div>
        )}
        
        {/* Zoom Indicator */}
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl clay-element px-4 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
