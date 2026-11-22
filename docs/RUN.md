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
3. Read and agree to the full SDK data-sharing disclosure before a live session. Local app records are stored in SQLite, but Presage's current SDK policy says derived measurements are automatically sent for cloud AI Insights, with Anthropic as its AI processor. Optional telemetry being off does not disable that processing. Presage says camera frames remain on the computer running the app; LabelLens itself does not record or upload participant video. Native SDK network behavior has not been independently verified.
4. Local records have no automatic expiry. Session deletion affects local app records, not provider-held records or backups. Review the SDK policy's retention and deletion sections: https://presagetech.com/legal/privacy-policy/ . No remote-camera forwarding is included.

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
