import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { BlockModel } from '../types/mineflow';
import { getBlockCoords, getBlockIndex, valueToColor, calculateStats, isBoundaryBlock } from '../lib/blockModel';

type ViewMode = 'all' | 'mined' | 'unmined';
type ColorScheme = 'value' | 'mined';
type SliceDimension = 'x' | 'y' | 'z';

interface Visualization3DProps {
  blockModel: BlockModel;
  minedBlocks?: Uint8Array;
  viewMode: ViewMode;
  currentLayer: number | null;
  sliceDimension: SliceDimension;
  colorScheme: ColorScheme;
  showWireframe: boolean;
  solveCount: number;
}

interface BlockInstancesProps {
  blockModel: BlockModel;
  minedBlocks?: Uint8Array;
  viewMode: ViewMode;
  currentLayer: number | null;
  sliceDimension: SliceDimension;
  colorScheme: ColorScheme;
  showWireframe: boolean;
  onBlockHover?: (blockIndex: number | null, position: [number, number, number] | null) => void;
  solveCount: number;
}

function BlockInstances({ blockModel, minedBlocks, viewMode, currentLayer, sliceDimension, colorScheme, showWireframe, onBlockHover, solveCount }: BlockInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Performance: Limit rendering for very large models
  const MAX_BLOCKS_TO_RENDER = 100000;
  
  const { positions, colors, count, isLimited, instanceToBlockIndex } = useMemo(() => {
    const stats = calculateStats(blockModel, minedBlocks);
    const tempPositions: number[] = [];
    const tempColors: number[] = [];
    const indexMapping: number[] = []; // Maps instance index to block index
    
    const color = new THREE.Color();
    let blocksRendered = 0;
    
    // Calculate center offset to center the model
    const centerX = blockModel.nx / 2;
    const centerY = blockModel.ny / 2;
    const centerZ = blockModel.nz / 2;
    
    // Performance: For "mined only" or "unmined only", don't skip blocks
    // because mined blocks are sparse and scattered
    // Also, when viewing a cross-section, show ALL blocks in that layer
    const totalBlocks = blockModel.values.length;
    const isFilteredView = viewMode !== 'all';
    const isCrossSection = currentLayer !== null;
    const skipFactor = (!isFilteredView && !isCrossSection && totalBlocks > MAX_BLOCKS_TO_RENDER)
      ? Math.ceil(totalBlocks / MAX_BLOCKS_TO_RENDER)
      : 1;
    
            for (let i = 0; i < blockModel.values.length; i += skipFactor) {
              // For cross-sections, show all blocks; otherwise enforce limit
              if (!isCrossSection && blocksRendered >= MAX_BLOCKS_TO_RENDER) break;
              
              const coords = getBlockCoords(i, blockModel.nx, blockModel.ny);
              
              // Layer filtering based on selected dimension
              if (currentLayer !== null) {
                const coordValue = sliceDimension === 'x' ? coords.x : 
                                   sliceDimension === 'y' ? coords.y : 
                                   coords.z;
                if (coordValue !== currentLayer) {
                  continue;
                }
              }
      
              // View mode filtering
              if (minedBlocks) {
                const isMined = minedBlocks[i] === 1;
                
                // In wireframe mode, never show unmined blocks
                if (showWireframe && !isMined) continue;
                
                if (viewMode === 'mined' && !isMined) continue;
                if (viewMode === 'unmined' && isMined) continue;
                
                // Wireframe mode: only show excavation surface (boundary blocks)
                if (showWireframe && isMined && !isBoundaryBlock(i, blockModel, minedBlocks)) {
                  continue;
                }
              }
      
      // Position (centered) - Z is up in mining coordinates
      const x = coords.x - centerX;
      const y = coords.z - centerZ;  // Z becomes Y (up/down in Three.js)
      const z = coords.y - centerY;  // Y becomes Z (depth)
      
      tempPositions.push(x, y, z);
      
      // Color
      if (colorScheme === 'mined' && minedBlocks) {
        if (minedBlocks[i] === 1) {
          color.setHex(0x22c55e); // Bright green for mined blocks
        } else {
          color.setHex(0x3f3f46); // Dark gray for unmined
        }
      } else {
        // Color by value
        const blockValue = blockModel.values[i];
        color.copy(valueToColor(blockValue, stats.maxAbsValue));
      }
      
      tempColors.push(color.r, color.g, color.b);
      indexMapping.push(i); // Store mapping from instance index to block index
      blocksRendered++;
    }
    
    console.log(`Rendering ${blocksRendered} blocks`);
    console.log(`  First color RGB: [${tempColors[0]}, ${tempColors[1]}, ${tempColors[2]}]`);
    console.log(`  Last color RGB: [${tempColors[tempColors.length-3]}, ${tempColors[tempColors.length-2]}, ${tempColors[tempColors.length-1]}]`);
    console.log(`  colorScheme: ${colorScheme}, has minedBlocks: ${!!minedBlocks}`);
    
    return {
      positions: new Float32Array(tempPositions),
      colors: new Float32Array(tempColors),
      count: blocksRendered,
      isLimited: skipFactor > 1 && !isCrossSection, // Don't warn for cross-sections
      instanceToBlockIndex: indexMapping,
    };
  }, [blockModel, minedBlocks, viewMode, currentLayer, sliceDimension, colorScheme, showWireframe, solveCount]);
  
  // Update instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    
    // Set positions
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      matrix.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    // Set instance colors
    const instanceColors = new THREE.InstancedBufferAttribute(colors, 3);
    instanceColors.needsUpdate = true;
    meshRef.current.geometry.setAttribute('color', instanceColors);
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Ensure the mesh computes its bounding box for raycasting
    meshRef.current.geometry.computeBoundingBox();
    meshRef.current.geometry.computeBoundingSphere();
    
    console.log('Applied colors to geometry, color attribute:', meshRef.current.geometry.getAttribute('color'));
  }, [positions, colors, count]);
  
  // Handle pointer move for hover detection
  const handlePointerMove = (event: any) => {
    if (!onBlockHover || !meshRef.current) return;
    
    event.stopPropagation();
    const instanceId = event.instanceId;
    
    if (instanceId !== undefined && instanceId < instanceToBlockIndex.length) {
      const blockIndex = instanceToBlockIndex[instanceId];
      const coords = getBlockCoords(blockIndex, blockModel.nx, blockModel.ny);
      
      // Convert to Three.js coordinates (same as rendering)
      const centerX = blockModel.nx / 2;
      const centerY = blockModel.ny / 2;
      const centerZ = blockModel.nz / 2;
      const x = coords.x - centerX;
      const y = coords.z - centerZ;
      const z = coords.y - centerY;
      
      onBlockHover(blockIndex, [x, y, z]);
    }
  };
  
  const handlePointerOut = () => {
    if (!onBlockHover) return;
    onBlockHover(null, null);
  };
  
  if (count === 0) {
    return null;
  }
  
  return (
    <>
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, count]}
        frustumCulled={false}
        onPointerMove={onBlockHover ? handlePointerMove : undefined}
        onPointerOut={onBlockHover ? handlePointerOut : undefined}
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial 
          vertexColors
          toneMapped={false}
        />
      </instancedMesh>
      {isLimited && (
        <Html position={[0, blockModel.nz / 2 + 5, 0]}>
          <div className="bg-yellow-600 text-black px-3 py-1 rounded text-xs whitespace-nowrap">
            ⚠️ Showing sample of blocks for performance
          </div>
        </Html>
      )}
    </>
  );
}

// Surface Mesh component for smooth contour visualization
interface SurfaceMeshProps {
  blockModel: BlockModel;
  minedBlocks: Uint8Array;
  colorScheme: ColorScheme;
  solveCount: number;
}

function SurfaceMesh({ blockModel, minedBlocks, colorScheme, solveCount }: SurfaceMeshProps) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];
    
    const stats = calculateStats(blockModel, minedBlocks);
    const color = new THREE.Color();
    
    const centerX = blockModel.nx / 2;
    const centerY = blockModel.ny / 2;
    const centerZ = blockModel.nz / 2;
    
    // For each boundary block, add faces for exposed sides
    for (let i = 0; i < blockModel.values.length; i++) {
      if (!isBoundaryBlock(i, blockModel, minedBlocks)) continue;
      
      const coords = getBlockCoords(i, blockModel.nx, blockModel.ny);
      const { nx, ny, nz } = blockModel;
      
      // Center position for this block
      const bx = coords.x - centerX;
      const by = coords.z - centerZ;  // Z becomes Y (up)
      const bz = coords.y - centerY;  // Y becomes Z (depth)
      
      // Color for this block
      if (colorScheme === 'mined') {
        color.setHex(0x22c55e); // Green for mined blocks
      } else {
        const blockValue = blockModel.values[i];
        color.copy(valueToColor(blockValue, stats.maxAbsValue));
      }
      
      // Check each of 6 faces and add if exposed
      const faces = [
        // -X face (left)
        { dx: -1, dy: 0, dz: 0, normal: [-1, 0, 0], corners: [
          [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5]
        ]},
        // +X face (right)
        { dx: 1, dy: 0, dz: 0, normal: [1, 0, 0], corners: [
          [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]
        ]},
        // -Y face (back) - remember Y is mining Z
        { dx: 0, dy: 0, dz: -1, normal: [0, 0, -1], corners: [
          [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5]
        ]},
        // +Y face (front)
        { dx: 0, dy: 0, dz: 1, normal: [0, 0, 1], corners: [
          [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
        ]},
        // -Z face (bottom) - remember Z is mining Y
        { dx: 0, dy: -1, dz: 0, normal: [0, -1, 0], corners: [
          [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]
        ]},
        // +Z face (top)
        { dx: 0, dy: 1, dz: 0, normal: [0, 1, 0], corners: [
          [-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]
        ]},
      ];
      
      for (const face of faces) {
        // Check if neighbor is unmined or out of bounds
        const nx_coord = coords.x + face.dx;
        const ny_coord = coords.y + face.dz; // Swap due to coordinate mapping
        const nz_coord = coords.z + face.dy;
        
        let isExposed = false;
        if (nx_coord < 0 || nx_coord >= nx ||
            ny_coord < 0 || ny_coord >= ny ||
            nz_coord < 0 || nz_coord >= nz) {
          isExposed = false; // Don't show faces at model boundary
        } else {
          const neighborIndex = getBlockIndex(nx_coord, ny_coord, nz_coord, nx, ny);
          isExposed = !minedBlocks[neighborIndex];
        }
        
        if (isExposed) {
          const baseIndex = vertices.length / 3;
          
          // Add 4 corners of the face
          for (const corner of face.corners) {
            vertices.push(bx + corner[0], by + corner[1], bz + corner[2]);
            colors.push(color.r, color.g, color.b);
            normals.push(face.normal[0], face.normal[1], face.normal[2]);
          }
          
          // Add two triangles for the quad face
          indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
          indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
        }
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    
    console.log(`Surface mesh: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
    
    return geo;
  }, [blockModel, minedBlocks, colorScheme, solveCount]);
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        flatShading={false}
        metalness={0.1}
        roughness={0.7}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Visualization3D({
  blockModel,
  minedBlocks,
  viewMode,
  currentLayer,
  sliceDimension,
  colorScheme,
  showWireframe,
  solveCount,
}: Visualization3DProps) {
  const [hoveredBlock, setHoveredBlock] = useState<{
    index: number;
    position: [number, number, number];
  } | null>(null);
  
  const handleBlockHover = (blockIndex: number | null, position: [number, number, number] | null) => {
    if (blockIndex !== null && position !== null) {
      setHoveredBlock({ index: blockIndex, position });
    } else {
      setHoveredBlock(null);
    }
  };
  
  // Calculate camera position based on model size
  const maxDim = Math.max(blockModel.nx, blockModel.ny, blockModel.nz);
  const cameraDistance = maxDim * 1.5;
  
  return (
    <Canvas
      gl={{ 
        antialias: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]} // Limit pixel ratio for performance
      performance={{ min: 0.5 }}
    >
      <PerspectiveCamera
        makeDefault
        position={[cameraDistance, cameraDistance, cameraDistance]}
        fov={50}
      />
      
      {/* Lighting - brighter for better visibility */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[50, 50, 50]} intensity={0.6} />
      <directionalLight position={[-50, -50, -50]} intensity={0.4} />
      <hemisphereLight intensity={0.4} />
      
      {/* Show surface mesh if wireframe mode and has solution, otherwise show blocks */}
      {showWireframe && minedBlocks ? (
        <SurfaceMesh
          blockModel={blockModel}
          minedBlocks={minedBlocks}
          colorScheme={colorScheme}
          solveCount={solveCount}
        />
      ) : (
        <BlockInstances
          blockModel={blockModel}
          minedBlocks={minedBlocks}
          viewMode={viewMode}
          currentLayer={currentLayer}
          sliceDimension={sliceDimension}
          colorScheme={colorScheme}
          showWireframe={showWireframe}
          onBlockHover={handleBlockHover}
          solveCount={solveCount}
        />
      )}
      
      {/* Block Info Tooltip */}
      {hoveredBlock && (
        <Html position={[hoveredBlock.position[0], hoveredBlock.position[1] + 0.7, hoveredBlock.position[2]]}>
          <div className="bg-gray-900/95 border border-gray-600 rounded px-3 py-2 text-xs text-white shadow-xl pointer-events-none">
            <div className="font-semibold text-blue-400 mb-1">Block #{hoveredBlock.index}</div>
            <div className="space-y-0.5">
              <div>
                <span className="text-gray-400">Coords:</span>{' '}
                <span className="font-mono">
                  ({getBlockCoords(hoveredBlock.index, blockModel.nx, blockModel.ny).x}, {' '}
                  {getBlockCoords(hoveredBlock.index, blockModel.nx, blockModel.ny).y}, {' '}
                  {getBlockCoords(hoveredBlock.index, blockModel.nx, blockModel.ny).z})
                </span>
              </div>
              <div>
                <span className="text-gray-400">Value:</span>{' '}
                <span className={`font-mono font-semibold ${blockModel.values[hoveredBlock.index] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {blockModel.values[hoveredBlock.index].toLocaleString()}
                </span>
              </div>
              {minedBlocks && (
                <div>
                  <span className="text-gray-400">Status:</span>{' '}
                  <span className={`font-semibold ${minedBlocks[hoveredBlock.index] ? 'text-green-400' : 'text-gray-500'}`}>
                    {minedBlocks[hoveredBlock.index] ? 'Mined' : 'Unmined'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
      
      {/* Grid Helper - on the ground (Y=0) */}
      <gridHelper
        args={[Math.max(blockModel.nx, blockModel.ny), 10]}
        position={[0, -blockModel.nz / 2 - 0.5, 0]}
      />
      
      {/* Axes Helper */}
      <axesHelper args={[maxDim / 2]} />
      
      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={maxDim * 3}
      />
    </Canvas>
  );
}

