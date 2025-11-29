# MineFlow UI

A modern desktop application for MineFlow ultimate pit limit calculation with full 3D visualization.

## Features

- 📁 Load block model data files (.dat format)
- 🎚️ Configure solver parameters (Regular, MinSearch, or Explicit modes)
- 🎯 Calculate optimal pit limits using the MineFlow engine
- 🎨 3D visualization of block models with interactive controls
- 📊 Real-time statistics and results display
- 💾 Export results to .dat or CSV formats
- 🔍 Layer-by-layer inspection
- 🎨 Multiple color schemes (by value or mined/unmined)

## Prerequisites

- Node.js (v18 or higher)
- The MineFlow C++ executable must be built at `../build/bin/mineflow`

## Installation

```bash
npm install
```

## Development

To run the app in development mode:

```bash
npm run dev
```

This will start both the Vite dev server and Electron.

## Building

To build the app for production:

```bash
npm run build
npm run dist
```

The packaged app will be in the `release/` directory.

## Usage

1. **Load a Model**: Click "Click to select .dat file" and choose your data file
2. **Set Dimensions**: Enter the grid dimensions (nx, ny, nz) or use a preset
3. **Load Model**: Click "Load Model" to parse and visualize the data
4. **Configure Parameters**: 
   - Select precedence mode (Regular, MinSearch, or Explicit)
   - Set slope angle or upload pattern/precedence files
5. **Calculate**: Click "Calculate Pit Limit" to solve
6. **Explore Results**: 
   - Rotate, zoom, and pan the 3D view
   - Toggle between view modes (all/mined/unmined)
   - Use the layer slider to inspect specific z-levels
   - View statistics in the results panel
7. **Export**: Save results as .dat or CSV files

## Project Structure

```
mineflow-ui/
├── electron/           # Electron main process
│   ├── main.ts        # Electron app setup
│   ├── preload.ts     # IPC bridge
│   └── mineflow.ts    # C++ executable interface
├── src/
│   ├── components/    # React components
│   ├── lib/          # Utilities
│   └── types/        # TypeScript definitions
└── dist/             # Build output
```

## Technologies

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js + react-three-fiber
- **Desktop**: Electron
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Backend**: MineFlow C++ executable

## License

MIT License - see parent project LICENSE file



