import { contextBridge, ipcRenderer } from 'electron';
import { MineflowParams, SolveResult } from '../src/types/mineflow';

contextBridge.exposeInMainWorld('mineflow', {
  selectFile: (): Promise<string | null> => {
    return ipcRenderer.invoke('select-file');
  },
  
  readFile: (path: string): Promise<string> => {
    return ipcRenderer.invoke('read-file', path);
  },
  
  solve: (dataPath: string, params: MineflowParams): Promise<SolveResult> => {
    return ipcRenderer.invoke('solve', dataPath, params);
  },
  
  exportResults: (outputPath: string, data: Uint8Array): Promise<void> => {
    return ipcRenderer.invoke('export-results', outputPath, data);
  },
  
  saveFile: (defaultPath: string): Promise<string | null> => {
    return ipcRenderer.invoke('save-file', defaultPath);
  },
});



