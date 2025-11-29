export interface BlockModel {
  nx: number;
  ny: number;
  nz: number;
  values: Int32Array;
}

export interface MineflowParams {
  mode: 'regular' | 'minsearch' | 'explicit';
  nx: number;
  ny: number;
  nz: number;
  slope?: number; // for regular mode (degrees)
  patternFile?: string; // for minsearch mode
  precedenceFile?: string; // for explicit mode
}

export interface SolveResult {
  minedBlocks: Uint8Array; // 0 or 1 for each block
  totalValue: number;
  numBlocksMined: number;
  elapsedSeconds: number;
}

export interface MineflowAPI {
  selectFile: () => Promise<string | null>;
  readFile: (path: string) => Promise<string>;
  solve: (dataPath: string, params: MineflowParams) => Promise<SolveResult>;
  exportResults: (outputPath: string, data: Uint8Array) => Promise<void>;
  saveFile: (defaultPath: string) => Promise<string | null>;
}

declare global {
  interface Window {
    mineflow: MineflowAPI;
  }
}

export {};



