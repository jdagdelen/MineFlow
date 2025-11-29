import { useState } from 'react';
import FileUpload from './components/FileUpload';
import ParameterPanel from './components/ParameterPanel';
import Visualization3D from './components/Visualization3D';
import Controls from './components/Controls';
import ResultsPanel from './components/ResultsPanel';
import { BlockModel, MineflowParams, SolveResult } from './types/mineflow';
import { parseDatFile } from './lib/fileParser';

type ViewMode = 'all' | 'mined' | 'unmined';
type SliceDimension = 'x' | 'y' | 'z';

function App() {
  const [blockModel, setBlockModel] = useState<BlockModel | null>(null);
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFilePath, setDataFilePath] = useState<string | null>(null);
  const [solveCount, setSolveCount] = useState(0); // Track number of solves
  
  // View controls
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentLayer, setCurrentLayer] = useState<number | null>(null);
  const [sliceDimension, setSliceDimension] = useState<SliceDimension>('z');
  const [colorScheme, setColorScheme] = useState<'value' | 'mined'>('value');
  const [showWireframe, setShowWireframe] = useState(false);
  
  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.mineflow !== undefined;

  const handleFileUpload = async (filePath: string, nx: number, ny: number, nz: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const content = await window.mineflow.readFile(filePath);
      const model = parseDatFile(content, nx, ny, nz);
      
      setBlockModel(model);
      setDataFilePath(filePath);
      setSolveResult(null);
      setCurrentLayer(null);
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      setIsLoading(false);
    }
  };

  const handleSolve = async (params: MineflowParams) => {
    if (!dataFilePath) {
      setError('No data file loaded');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await window.mineflow.solve(dataFilePath, params);
      setSolveResult(result);
      setSolveCount(prev => prev + 1); // Increment solve counter
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve');
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!solveResult) return;
    
    try {
      const outputPath = await window.mineflow.saveFile('mineflow_output.dat');
      if (outputPath) {
        await window.mineflow.exportResults(outputPath, solveResult.minedBlocks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Warning if not in Electron */}
      {!isElectron && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-black px-4 py-2 text-center font-medium z-50">
          ⚠️ Not running in Electron! Please run: npm start
        </div>
      )}
      
      {/* Left Panel */}
      <div className="w-96 flex flex-col border-r border-gray-700 overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">MineFlow UI</h1>
          <p className="text-sm text-gray-400 mt-1">Ultimate Pit Limit Calculator</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <FileUpload onFileLoad={handleFileUpload} disabled={isLoading} />
          
          {blockModel && (
            <ParameterPanel
              blockModel={blockModel}
              onSolve={handleSolve}
              disabled={isLoading}
            />
          )}
          
          {solveResult && blockModel && (
            <ResultsPanel
              blockModel={blockModel}
              result={solveResult}
              onExport={handleExport}
            />
          )}
        </div>
        
        {error && (
          <div className="p-4 m-4 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col">
        {blockModel ? (
          <>
            <div className="flex-1 relative">
              <Visualization3D
                blockModel={blockModel}
                minedBlocks={solveResult?.minedBlocks}
                viewMode={viewMode}
                currentLayer={currentLayer}
                sliceDimension={sliceDimension}
                colorScheme={colorScheme}
                showWireframe={showWireframe}
                solveCount={solveCount}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Processing...</p>
                  </div>
                </div>
              )}
            </div>
            
            <Controls
              blockModel={blockModel}
              viewMode={viewMode}
              setViewMode={setViewMode}
              currentLayer={currentLayer}
              setCurrentLayer={setCurrentLayer}
              sliceDimension={sliceDimension}
              setSliceDimension={setSliceDimension}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
              showWireframe={showWireframe}
              setShowWireframe={setShowWireframe}
              hasSolution={solveResult !== null}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xl">Upload a data file to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

