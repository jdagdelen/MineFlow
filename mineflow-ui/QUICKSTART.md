# Quick Start Guide

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

1. Start the Vite dev server:
```bash
npm run dev
```

2. In another terminal, start Electron:
```bash
npm run electron:start
```

Or use the combined command:
```bash
npm start
```

The app will open in a new window. Any changes to the source files will trigger a reload.

### Testing the Application

1. Make sure the MineFlow executable is built:
```bash
cd ..
mkdir -p build && cd build
cmake ..
make
```

2. The executable should be at: `../build/bin/mineflow`

3. Load one of the example data files:
   - Click "Click to select .dat file"
   - Navigate to `../data/` and select a file (e.g., `bauxitemed.dat`)
   - Use the preset button or enter dimensions manually
   - Click "Load Model"

4. Configure solver parameters:
   - Select "Regular Grid" mode
   - Adjust slope angle (default: 45°)
   - Click "Calculate Pit Limit"

5. Explore the results:
   - Rotate: Click and drag
   - Zoom: Scroll wheel
   - Pan: Right-click and drag
   - Use the layer slider at the bottom
   - Toggle view modes and color schemes

### Building for Distribution

To create a distributable package:

```bash
npm run dist
```

The packaged app will be in the `release/` directory.

## Troubleshooting

### "Mineflow executable not found"

Make sure the C++ executable is built:
```bash
cd /Users/jdagdelen/Dropbox/Mining/MineFlow
mkdir -p build && cd build
cmake ..
make
```

### "Failed to load file"

- Check that grid dimensions match the data file
- Verify the file format (one integer per line)
- See `../data/README.md` for format details

### "Solver error"

- Check that the data file path is valid
- For MinSearch/Explicit modes, verify pattern/precedence files are provided
- Check the terminal output for detailed error messages

## Example Data Files

Located in `../data/`:
- `bauxitemed.dat` (120×120×26) - 374,400 blocks
- `cucase.dat` (170×215×50) - 1,827,500 blocks  
- `cupipe.dat` (180×180×85) - 2,754,000 blocks
- `mclaughlingeo.dat` (140×296×68) - 2,817,920 blocks
- `sim2d76.dat` (75×1×40) - 3,000 blocks (2D)

Start with smaller files first to test the application!



