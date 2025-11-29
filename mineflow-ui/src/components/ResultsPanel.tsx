import { BlockModel, SolveResult } from '../types/mineflow';
import { calculateStats } from '../lib/blockModel';
import { exportToCSV } from '../lib/fileParser';

interface ResultsPanelProps {
  blockModel: BlockModel;
  result: SolveResult;
  onExport: () => void;
}

export default function ResultsPanel({ blockModel, result, onExport }: ResultsPanelProps) {
  const stats = calculateStats(blockModel, result.minedBlocks);

  const handleExportCSV = async () => {
    const csv = exportToCSV(blockModel, result.minedBlocks);
    const outputPath = await window.mineflow.saveFile('mineflow_export.csv');
    if (outputPath) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const arrayBuffer = await blob.arrayBuffer();
      await window.mineflow.exportResults(outputPath, new Uint8Array(arrayBuffer));
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const mineRatio = (result.numBlocksMined / blockModel.values.length) * 100;

  return (
    <div className="p-6 border-b border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Results</h2>

      {/* Main Stats */}
      <div className="space-y-3 mb-4">
        <div className="p-3 bg-green-900/30 border border-green-700 rounded">
          <div className="text-xs text-green-400 mb-1">Pit Value</div>
          <div className="text-2xl font-bold text-green-300">
            {formatNumber(stats.minedValue)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded">
            <div className="text-xs text-gray-400 mb-1">Blocks Mined</div>
            <div className="text-lg font-semibold text-blue-300">
              {formatNumber(result.numBlocksMined)}
            </div>
            <div className="text-xs text-gray-500">
              {mineRatio.toFixed(1)}% of total
            </div>
          </div>

          <div className="p-3 bg-gray-800 rounded">
            <div className="text-xs text-gray-400 mb-1">Solve Time</div>
            <div className="text-lg font-semibold text-purple-300">
              {result.elapsedSeconds.toFixed(2)}s
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-300 mb-2">Block Model Stats</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Blocks:</span>
            <span className="font-mono">{formatNumber(blockModel.values.length)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Value Range:</span>
            <span className="font-mono">
              {formatNumber(stats.minValue)} to {formatNumber(stats.maxValue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Positive Blocks:</span>
            <span className="font-mono">{formatNumber(stats.positiveCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Negative Blocks:</span>
            <span className="font-mono">{formatNumber(stats.negativeCount)}</span>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="space-y-2">
        <button
          onClick={onExport}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          Export .dat File
        </button>
        <button
          onClick={handleExportCSV}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
        >
          Export as CSV
        </button>
      </div>
    </div>
  );
}

