import React, { useState, useRef, useEffect } from "react";
import { User } from "@/entities/all";
import { 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Trash2, 
  Save, 
  Users, 
  Palette,
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Hand
} from "lucide-react";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [brushSize, setBrushSize] = useState(3);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, []);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen', color: 'blue' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', color: 'red' },
    { id: 'square', icon: Square, label: 'Rectangle', color: 'green' },
    { id: 'circle', icon: Circle, label: 'Circle', color: 'purple' },
    { id: 'text', icon: Type, label: 'Text', color: 'orange' },
    { id: 'pan', icon: Hand, label: 'Pan', color: 'gray' }
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL();
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(imageData);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyStep - 1];
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyStep + 1];
    }
  };

  const startDrawing = (e) => {
    if (currentTool === 'pan') {
      setIsPanning(true);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
    }
    
    ctx.restore();
  };

  const draw = (e) => {
    if (!isDrawing && !isPanning) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (isPanning) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
    setIsPanning(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const zoomIn = () => setZoom(Math.min(zoom * 1.2, 5));
  const zoomOut = () => setZoom(Math.max(zoom * 0.8, 0.2));

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl clay-element border-b border-white/20 dark:border-gray-700/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Drawing Tools */}
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setCurrentTool(tool.id)}
                  className={`
                    w-12 h-12 rounded-2xl clay-button flex items-center justify-center transition-all duration-300
                    ${currentTool === tool.id 
                      ? `bg-${tool.color}-100 dark:bg-${tool.color}-900/50 text-${tool.color}-700 dark:text-${tool.color}-300 clay-element` 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                  title={tool.label}
                >
                  <tool.icon className="w-6 h-6" />
                </button>
              ))}
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Size:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-6">{brushSize}</span>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`
                    w-8 h-8 rounded-2xl clay-element border-2 transition-transform duration-200
                    ${currentColor === color ? 'scale-110 border-gray-400' : 'border-gray-200 dark:border-gray-600'}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 disabled:opacity-50"
            >
              <Undo className="w-5 h-5" />
            </button>

            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 disabled:opacity-50"
            >
              <Redo className="w-5 h-5" />
            </button>

            <button
              onClick={zoomOut}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={zoomIn}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <button
              onClick={clearCanvas}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={downloadCanvas}
              className="w-10 h-10 rounded-2xl clay-button flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400"
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-green-100 dark:bg-green-900/50 clay-inner">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">1 user</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair bg-white dark:bg-gray-100"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: currentTool === 'pan' ? 'grab' : 'crosshair',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
          }}
        />
        
        {/* Canvas Overlay Info */}
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl clay-element p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>Tool: <span className="font-medium capitalize">{currentTool}</span></div>
            <div>Zoom: <span className="font-medium">{Math.round(zoom * 100)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}