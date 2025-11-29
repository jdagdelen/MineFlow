import { BlockModel } from '../types/mineflow';
import * as THREE from 'three';

/**
 * Get block index from x, y, z coordinates
 * Blocks are ordered: x-fastest, then y, then z
 */
export function getBlockIndex(x: number, y: number, z: number, nx: number, ny: number): number {
  return x + y * nx + z * nx * ny;
}

/**
 * Get x, y, z coordinates from block index
 */
export function getBlockCoords(index: number, nx: number, ny: number): { x: number; y: number; z: number } {
  const x = index % nx;
  const y = Math.floor(index / nx) % ny;
  const z = Math.floor(index / (nx * ny));
  return { x, y, z };
}

/**
 * Calculate color for a block value using a vibrant diverging color scheme
 * Negative values (waste) -> Red to Orange
 * Positive values (ore) -> Yellow to Green to Cyan to Blue
 */
export function valueToColor(value: number, maxAbsValue: number): THREE.Color {
  const normalized = value / maxAbsValue; // -1 to +1
  
  if (normalized < 0) {
    // Negative values: Dark Red -> Bright Red -> Orange
    const t = Math.abs(normalized); // 0 to 1
    if (t < 0.5) {
      // Dark red to bright red
      const s = t * 2; // 0 to 1
      return new THREE.Color(
        0.5 + s * 0.5,  // 0.5 to 1.0 (red)
        0.0,            // 0 (green)
        0.0             // 0 (blue)
      );
    } else {
      // Bright red to orange
      const s = (t - 0.5) * 2; // 0 to 1
      return new THREE.Color(
        1.0,              // 1.0 (red)
        s * 0.4,          // 0 to 0.4 (green - adds orange)
        0.0               // 0 (blue)
      );
    }
  } else {
    // Positive values: Yellow -> Green -> Cyan -> Blue
    const t = normalized; // 0 to 1
    if (t < 0.33) {
      // Yellow to Green
      const s = t / 0.33; // 0 to 1
      return new THREE.Color(
        1.0 - s * 0.5,    // 1.0 to 0.5 (red)
        1.0,              // 1.0 (green)
        0.0               // 0 (blue)
      );
    } else if (t < 0.67) {
      // Green to Cyan
      const s = (t - 0.33) / 0.34; // 0 to 1
      return new THREE.Color(
        0.5 - s * 0.5,    // 0.5 to 0.0 (red)
        1.0,              // 1.0 (green)
        s * 1.0           // 0 to 1.0 (blue)
      );
    } else {
      // Cyan to Blue
      const s = (t - 0.67) / 0.33; // 0 to 1
      return new THREE.Color(
        0.0,              // 0 (red)
        1.0 - s * 0.5,    // 1.0 to 0.5 (green)
        1.0               // 1.0 (blue)
      );
    }
  }
}

/**
 * Check if a block is on the excavation surface (pit shell)
 * A mined block is on the surface if it has at least one unmined neighbor (within bounds)
 * This shows the inner surface of the pit that you can see looking down into it
 */
export function isBoundaryBlock(
  index: number,
  blockModel: BlockModel,
  minedBlocks: Uint8Array
): boolean {
  // Only mined blocks can be on the boundary
  if (!minedBlocks[index]) return false;
  
  const coords = getBlockCoords(index, blockModel.nx, blockModel.ny);
  const { nx, ny, nz } = blockModel;
  
  // Check all 6 neighbors (±x, ±y, ±z)
  const neighbors = [
    { x: coords.x - 1, y: coords.y, z: coords.z },
    { x: coords.x + 1, y: coords.y, z: coords.z },
    { x: coords.x, y: coords.y - 1, z: coords.z },
    { x: coords.x, y: coords.y + 1, z: coords.z },
    { x: coords.x, y: coords.y, z: coords.z - 1 },
    { x: coords.x, y: coords.y, z: coords.z + 1 },
  ];
  
  for (const neighbor of neighbors) {
    // Skip out of bounds neighbors - we only care about the excavation surface
    if (neighbor.x < 0 || neighbor.x >= nx ||
        neighbor.y < 0 || neighbor.y >= ny ||
        neighbor.z < 0 || neighbor.z >= nz) {
      continue;
    }
    
    // Unmined neighbor = this is on the excavation surface
    const neighborIndex = getBlockIndex(neighbor.x, neighbor.y, neighbor.z, nx, ny);
    if (!minedBlocks[neighborIndex]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate statistics for a block model
 */
export function calculateStats(model: BlockModel, minedBlocks?: Uint8Array) {
  let minValue = Infinity;
  let maxValue = -Infinity;
  let totalValue = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let minedValue = 0;
  let minedCount = 0;
  
  for (let i = 0; i < model.values.length; i++) {
    const value = model.values[i];
    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);
    totalValue += value;
    
    if (value > 0) positiveCount++;
    if (value < 0) negativeCount++;
    
    if (minedBlocks && minedBlocks[i] === 1) {
      minedValue += value;
      minedCount++;
    }
  }
  
  return {
    minValue,
    maxValue,
    maxAbsValue: Math.max(Math.abs(minValue), Math.abs(maxValue)),
    totalValue,
    averageValue: totalValue / model.values.length,
    positiveCount,
    negativeCount,
    minedValue,
    minedCount,
  };
}


