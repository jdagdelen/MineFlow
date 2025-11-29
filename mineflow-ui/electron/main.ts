import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { runMineflow } from './mineflow';
import { MineflowParams } from '../src/types/mineflow';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#1f2937', // Prevent white flash and color profile issues
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow file:// protocol access for drag-and-drop
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Data Files', extensions: ['dat', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Select .dat file',
      buttonLabel: 'Select',
    });

    if (result.canceled) {
      return null;
    }
    return result.filePaths[0];
  } catch (error) {
    console.error('Error in file dialog:', error);
    throw error;
  }
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
});

ipcMain.handle('solve', async (_event, dataPath: string, params: MineflowParams) => {
  try {
    const result = await runMineflow(dataPath, params);
    return result;
  } catch (error) {
    throw new Error(`Solver error: ${error}`);
  }
});

ipcMain.handle('export-results', async (_event, outputPath: string, data: Uint8Array) => {
  try {
    const lines = Array.from(data).join('\n');
    fs.writeFileSync(outputPath, lines, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to export results: ${error}`);
  }
});

ipcMain.handle('save-file', async (_event, defaultPath: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [
      { name: 'Data Files', extensions: ['dat', 'txt', 'csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return null;
  }
  return result.filePath;
});

