import { useState } from 'react';
import { BlockModel, MineflowParams } from '../types/mineflow';

interface ParameterPanelProps {
  blockModel: BlockModel;
  onSolve: (params: MineflowParams) => void;
  disabled: boolean;
}

export default function ParameterPanel({ blockModel, onSolve, disabled }: ParameterPanelProps) {
  const [mode, setMode] = useState<'regular' | 'minsearch' | 'explicit'>('regular');
  const [slope, setSlope] = useState(45);
  const [patternFile, setPatternFile] = useState<string | null>(null);
  const [precedenceFile, setPrecedenceFile] = useState<string | null>(null);

  const handleSelectPatternFile = async () => {
    const filePath = await window.mineflow.selectFile();
    if (filePath) {
      setPatternFile(filePath);
    }
  };

  const handleSelectPrecedenceFile = async () => {
    const filePath = await window.mineflow.selectFile();
    if (filePath) {
      setPrecedenceFile(filePath);
    }
  };

  const handleSolve = () => {
    const params: MineflowParams = {
      mode,
      nx: blockModel.nx,
      ny: blockModel.ny,
      nz: blockModel.nz,
    };

    if (mode === 'regular') {
      params.slope = slope;
    } else if (mode === 'minsearch') {
      if (!patternFile) {
        alert('Please select a pattern file');
        return;
      }
      params.patternFile = patternFile;
    } else if (mode === 'explicit') {
      if (!precedenceFile) {
        alert('Please select a precedence file');
        return;
      }
      params.precedenceFile = precedenceFile;
    }

    onSolve(params);
  };

  return (
    <div className="p-6 border-b border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Solver Parameters</h2>

      {/* Model Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
        <div className="text-gray-400 mb-1">Model Size</div>
        <div className="font-mono text-blue-400">
          {blockModel.nx} × {blockModel.ny} × {blockModel.nz}
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {(blockModel.nx * blockModel.ny * blockModel.nz).toLocaleString()} blocks
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Precedence Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer border-2 border-transparent has-[:checked]:border-blue-500 transition-colors">
            <input
              type="radio"
              name="mode"
              value="regular"
              checked={mode === 'regular'}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              disabled={disabled}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Regular Grid</div>
              <div className="text-xs text-gray-400">Single constant slope angle</div>
            </div>
          </label>

          <label className="flex items-center p-3 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer border-2 border-transparent has-[:checked]:border-blue-500 transition-colors">
            <input
              type="radio"
              name="mode"
              value="minsearch"
              checked={mode === 'minsearch'}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              disabled={disabled}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Minimum Search</div>
              <div className="text-xs text-gray-400">Pattern-based precedence</div>
            </div>
          </label>

          <label className="flex items-center p-3 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer border-2 border-transparent has-[:checked]:border-blue-500 transition-colors">
            <input
              type="radio"
              name="mode"
              value="explicit"
              checked={mode === 'explicit'}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              disabled={disabled}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Explicit</div>
              <div className="text-xs text-gray-400">Custom precedence constraints</div>
            </div>
          </label>
        </div>
      </div>

      {/* Mode-specific parameters */}
      {mode === 'regular' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slope Angle (degrees)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="90"
              value={slope}
              onChange={(e) => setSlope(parseInt(e.target.value))}
              disabled={disabled}
              className="flex-1"
            />
            <input
              type="number"
              value={slope}
              onChange={(e) => setSlope(parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center focus:outline-none focus:border-blue-500"
              min="0"
              max="90"
            />
            <span className="text-gray-400">°</span>
          </div>
        </div>
      )}

      {mode === 'minsearch' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pattern File
          </label>
          <button
            onClick={handleSelectPatternFile}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-left text-sm transition-colors"
          >
            {patternFile ? (
              <span className="text-blue-400">{patternFile.split('/').pop()}</span>
            ) : (
              <span className="text-gray-400">Select pattern file...</span>
            )}
          </button>
        </div>
      )}

      {mode === 'explicit' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Precedence File
          </label>
          <button
            onClick={handleSelectPrecedenceFile}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-left text-sm transition-colors"
          >
            {precedenceFile ? (
              <span className="text-blue-400">{precedenceFile.split('/').pop()}</span>
            ) : (
              <span className="text-gray-400">Select precedence file...</span>
            )}
          </button>
        </div>
      )}

      {/* Solve Button */}
      <button
        onClick={handleSolve}
        disabled={disabled}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
      >
        Calculate Pit Limit
      </button>
    </div>
  );
}



