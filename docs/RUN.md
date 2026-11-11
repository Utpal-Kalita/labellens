# LabelLens run sheet

## Supported systems

LabelLens bundles the Presage SmartSpectra Node SDK, which ships native
binaries for these platforms only:

| OS | Architecture | Status |
|---|---|---|
| Windows | x64 | Supported |
| Linux | x64, ARM64 | Supported |
| macOS | Apple Silicon (arm64) | Supported |
| macOS | Intel | Not supported (no SDK binary) |
| Windows | ARM64 | Not supported (no SDK binary) |

## Install and run

### Windows
- `LabelLens-Setup-<version>.exe` (NSIS installer) when built on a machine
  with wine (Linux) or natively on Windows. The build here produced
  `LabelLens-Setup-<version>.zip` instead: unzip anywhere and run
  `LabelLens.exe`.
- The binaries are unsigned, so Windows may show a SmartScreen
  reputation warning on first run. That is expected for an unsigned app;
  only run builds you got from a source you trust.

### Linux
- `LabelLens-<version>.AppImage`: make it executable (`chmod +x`) and run it.
- Requires FUSE (standard on most desktop distributions). On systems without
  FUSE, run with `--appimage-extract` and launch the extracted `labellens`
  binary.
- The AppImage is unsigned; no signature prompt applies on Linux.

### macOS
- Apple Silicon Macs only. Build with `npm run dist -- --mac` on a Mac.

## First launch

1. The app asks for a Presage SmartSpectra API key (Settings). Get one from
   the Presage developer portal; the free tier works.
2. Camera access is requested per session, after the explicit consent screen.
3. All research data stays on the machine in a local SQLite database. Camera
   frames are processed on-device by the SmartSpectra SDK and never recorded.

## Development

```bash
npm install
npm run dev          # vite + electron with hot reload
npm run build        # production renderer build
npm run dist:linux   # AppImage into release/
npm run dist:win     # NSIS installer (needs wine on Linux, or build on Windows)
npx electron-builder --win zip   # zip fallback without wine
npm run smoke        # headless SDK smoke test (uses Presage credits)
```

## Packaging notes

- electron-builder config lives in package.json under `build`.
- SmartSpectra native binaries and sql.js are unpacked from the asar archive
  (`asarUnpack`) so the SDK can load them via FFI.
- Windows builds here use `signAndEditExecutable: false` because the build
  environment has no wine; exe icons/metadata are default and binaries are
  unsigned.
- The NSIS installer target additionally needs wine on Linux to stamp the
  final installer executable; without wine, use the zip target.
