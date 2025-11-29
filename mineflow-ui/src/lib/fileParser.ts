import { BlockModel } from '../types/mineflow';

/**
 * Parse a .dat file containing block values
 * Format: one integer per line, ordered x-fastest, then y, then z
 */
export function parseDatFile(content: string, nx: number, ny: number, nz: number): BlockModel {
  const lines = content.trim().split('\n');
  const expectedBlocks = nx * ny * nz;
  
  if (lines.length !== expectedBlocks) {
    throw new Error(
      `Expected ${expectedBlocks} blocks (${nx}x${ny}x${nz}), but file contains ${lines.length} values`
    );
  }
  
  const values = new Int32Array(expectedBlocks);
  
  for (let i = 0; i < expectedBlocks; i++) {
    const value = parseInt(lines[i].trim(), 10);
    if (isNaN(value)) {
      throw new Error(`Invalid value at line ${i + 1}: "${lines[i]}"`);
    }
    values[i] = value;
  }
  
  return {
    nx,
    ny,
    nz,
    values,
  };
}

/**
 * Parse output.dat file (0 or 1 per block indicating if mined)
 */
export function parseOutputFile(content: string, numBlocks: number): Uint8Array {
  const lines = content.trim().split('\n');
  
  if (lines.length !== numBlocks) {
    throw new Error(`Expected ${numBlocks} blocks, but output contains ${lines.length} values`);
  }
  
  const result = new Uint8Array(numBlocks);
  
  for (let i = 0; i < numBlocks; i++) {
    const value = parseInt(lines[i].trim(), 10);
    if (value !== 0 && value !== 1) {
      throw new Error(`Invalid output value at line ${i + 1}: expected 0 or 1, got ${value}`);
    }
    result[i] = value;
  }
  
  return result;
}

/**
 * Export results to CSV format
 */
export function exportToCSV(model: BlockModel, minedBlocks: Uint8Array): string {
  const lines = ['x,y,z,value,mined'];
  
  let idx = 0;
  for (let z = 0; z < model.nz; z++) {
    for (let y = 0; y < model.ny; y++) {
      for (let x = 0; x < model.nx; x++) {
        const value = model.values[idx];
        const mined = minedBlocks[idx];
        lines.push(`${x},${y},${z},${value},${mined}`);
        idx++;
      }
    }
  }
  
  return lines.join('\n');
}



