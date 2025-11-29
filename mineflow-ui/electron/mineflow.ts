import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { MineflowParams, SolveResult } from '../src/types/mineflow';

/**
 * Get the path to the mineflow executable
 */
function getMineflowPath(): string {
  // In development, use the built executable from the parent directory
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../../build/bin/mineflow');
  }
  
  // In production, the executable should be bundled with the app
  const executableName = process.platform === 'win32' ? 'mineflow.exe' : 'mineflow';
  return path.join(process.resourcesPath, 'bin', executableName);
}

/**
 * Run the mineflow solver
 */
export async function runMineflow(dataPath: string, params: MineflowParams): Promise<SolveResult> {
  const mineflowPath = getMineflowPath();
  
  if (!fs.existsSync(mineflowPath)) {
    throw new Error(`Mineflow executable not found at: ${mineflowPath}`);
  }
  
  // Create temp directory for output
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mineflow-'));
  const outputPath = path.join(tempDir, 'output.dat');
  
  try {
    const startTime = Date.now();
    
    // Build command line arguments based on mode
    const args: string[] = [];
    
    if (params.mode === 'regular') {
      args.push('--regular', 
        params.nx.toString(), 
        params.ny.toString(), 
        params.nz.toString(), 
        params.slope!.toString()
      );
    } else if (params.mode === 'minsearch') {
      if (!params.patternFile) {
        throw new Error('Pattern file required for minsearch mode');
      }
      args.push('--minsearch', params.patternFile);
    } else if (params.mode === 'explicit') {
      if (!params.precedenceFile) {
        throw new Error('Precedence file required for explicit mode');
      }
      args.push('--explicit', params.precedenceFile);
    }
    
    args.push(dataPath, outputPath);
    
    // Execute mineflow
    const result = await new Promise<string>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      const child = spawn(mineflowPath, args);
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to execute mineflow: ${error.message}`));
      });
      
      child.on('close', (code) => {
        console.log(`Mineflow process closed with code ${code}`);
        console.log(`Stdout:`, stdout);
        console.log(`Stderr:`, stderr);
        
        if (code !== 0) {
          reject(new Error(`Mineflow exited with code ${code}:\n${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
    
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    
    // Read the output file
    const outputContent = fs.readFileSync(outputPath, 'utf-8');
    const lines = outputContent.trim().split('\n');
    
    const numBlocks = params.nx * params.ny * params.nz;
    const minedBlocks = new Uint8Array(numBlocks); // All zeros initially
    
    console.log(`Output file has ${lines.length} lines (mined block indices)`);
    console.log(`First 10 lines:`, lines.slice(0, 10));
    
    // Output file contains indices of blocks to mine, not 0/1 for each block
    let numBlocksMined = 0;
    for (let i = 0; i < lines.length; i++) {
      const blockIndex = parseInt(lines[i].trim(), 10);
      if (!isNaN(blockIndex) && blockIndex >= 0 && blockIndex < numBlocks) {
        minedBlocks[blockIndex] = 1;
        numBlocksMined++;
      }
    }
    
    console.log(`Total blocks mined: ${numBlocksMined} out of ${numBlocks}`);
    
    // Parse total value from stdout
    // Format: "Value       : 1141850893"
    let totalValue = 0;
    const valueMatch = result.match(/Value\s*:\s*(-?\d+)/);
    if (valueMatch) {
      totalValue = parseFloat(valueMatch[1]);
    }
    
    console.log(`Parsed pit value: ${totalValue}`);
    
    // Clean up temp directory
    try {
      fs.unlinkSync(outputPath);
      fs.rmdirSync(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return {
      minedBlocks,
      totalValue,
      numBlocksMined,
      elapsedSeconds,
    };
    
  } catch (error) {
    // Clean up temp directory on error
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      fs.rmdirSync(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

