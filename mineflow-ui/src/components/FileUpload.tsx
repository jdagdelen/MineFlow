import { useState } from 'react';

interface FileUploadProps {
  onFileLoad: (filePath: string, nx: number, ny: number, nz: number) => void;
  disabled: boolean;
}

export default function FileUpload({ onFileLoad, disabled }: FileUploadProps) {
  const [nx, setNx] = useState(120);
  const [ny, setNy] = useState(120);
  const [nz, setNz] = useState(26);
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleSelectFile = async () => {
    try {
      if (!window.mineflow) {
        alert('Electron API not available. Please restart the application.');
        return;
      }
      
      const filePath = await window.mineflow.selectFile();
      if (filePath) {
        setSelectedFile(filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      alert('Failed to select file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleLoad = () => {
    if (selectedFile && nx > 0 && ny > 0 && nz > 0) {
      onFileLoad(selectedFile, nx, ny, nz);
    }
  };

  const presets = [
    { name: 'BauxiteMed', nx: 120, ny: 120, nz: 26 },
    { name: 'CuCase', nx: 170, ny: 215, nz: 50 },
    { name: 'CuPipe', nx: 180, ny: 180, nz: 85 },
    { name: 'McLaughlinGeo', nx: 140, ny: 296, nz: 68 },
    { name: 'Sim2D76', nx: 75, ny: 1, nz: 40 },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setNx(preset.nx);
    setNy(preset.ny);
    setNz(preset.nz);
  };

  return (
    <div className="p-6 border-b border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Load Data File</h2>
      
      {/* File Path Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          File Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            placeholder="/Users/jdagdelen/Dropbox/Mining/MineFlow/data/sim2d76.dat"
            disabled={disabled}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50 text-sm"
          />
          <button
            onClick={handleSelectFile}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded text-sm font-medium transition-colors whitespace-nowrap"
          >
            Browse
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Paste the full path above or click Browse to select
        </p>
      </div>

      {/* Grid Dimensions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Grid Dimensions
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">NX</label>
            <input
              type="number"
              value={nx}
              onChange={(e) => setNx(parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">NY</label>
            <input
              type="number"
              value={ny}
              onChange={(e) => setNy(parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">NZ</label>
            <input
              type="number"
              value={nz}
              onChange={(e) => setNz(parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
              min="1"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Total blocks: {(nx * ny * nz).toLocaleString()}
        </div>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePreset(preset)}
              disabled={disabled}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-600 rounded text-xs transition-colors"
            >
              {preset.name}
              <div className="text-gray-500 text-xs">
                {preset.nx}×{preset.ny}×{preset.nz}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={!selectedFile || disabled}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
      >
        Load Model
      </button>
    </div>
  );
}
