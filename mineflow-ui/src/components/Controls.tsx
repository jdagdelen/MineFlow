import { BlockModel } from '../types/mineflow';

type ViewMode = 'all' | 'mined' | 'unmined';
type ColorScheme = 'value' | 'mined';
type SliceDimension = 'x' | 'y' | 'z';

interface ControlsProps {
  blockModel: BlockModel;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentLayer: number | null;
  setCurrentLayer: (layer: number | null) => void;
  sliceDimension: SliceDimension;
  setSliceDimension: (dim: SliceDimension) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  hasSolution: boolean;
}

export default function Controls({
  blockModel,
  viewMode,
  setViewMode,
  currentLayer,
  setCurrentLayer,
  sliceDimension,
  setSliceDimension,
  colorScheme,
  setColorScheme,
  showWireframe,
  setShowWireframe,
  hasSolution,
}: ControlsProps) {
  const handleLayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCurrentLayer(value === -1 ? null : value);
  };
  
  const handleDimensionChange = (newDim: SliceDimension) => {
    setSliceDimension(newDim);
    // Reset layer to null when switching dimensions
    setCurrentLayer(null);
  };
  
  // Get max layer value based on selected dimension
  const getMaxLayer = () => {
    switch (sliceDimension) {
      case 'x': return blockModel.nx - 1;
      case 'y': return blockModel.ny - 1;
      case 'z': return blockModel.nz - 1;
    }
  };
  
  // Get dimension label
  const getDimensionLabel = () => {
    switch (sliceDimension) {
      case 'x': return 'X';
      case 'y': return 'Y';
      case 'z': return 'Z (Elevation)';
    }
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      <div className="flex items-center gap-6">
        {/* View Mode */}
        {hasSolution && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Blocks</option>
              <option value="mined">Mined Only</option>
              <option value="unmined">Unmined Only</option>
            </select>
          </div>
        )}

        {/* Color Scheme */}
        {hasSolution && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Color:</label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="value">By Value</option>
              <option value="mined">Mined/Unmined</option>
            </select>
          </div>
        )}

        {/* Wireframe Toggle */}
        {hasSolution && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showWireframe}
                onChange={(e) => setShowWireframe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <span className="text-sm text-gray-400">Pit Surface Only</span>
            </label>
          </div>
        )}

        {/* Slice Dimension Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Slice:</label>
          <div className="flex gap-1">
            {(['x', 'y', 'z'] as SliceDimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => handleDimensionChange(dim)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  sliceDimension === dim
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {dim.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Slider */}
        <div className="flex-1 flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Layer:</label>
          <input
            type="range"
            min="-1"
            max={getMaxLayer()}
            value={currentLayer ?? -1}
            onChange={handleLayerChange}
            className="flex-1"
          />
          <div className="w-32 text-sm text-gray-300 text-right">
            {currentLayer !== null ? `${getDimensionLabel()} = ${currentLayer}` : 'All Layers'}
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500">
          {blockModel.nx} × {blockModel.ny} × {blockModel.nz}
        </div>
      </div>
    </div>
  );
}


