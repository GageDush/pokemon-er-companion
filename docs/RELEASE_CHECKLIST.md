# Release Checklist

## Required Before Any User Build

- [ ] `npm.cmd install` completes.
- [ ] `npm.cmd run data:generate` completes with manifest and warnings.
- [ ] `npm.cmd run typecheck` passes.
- [ ] `npm.cmd run lint` passes.
- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] README limitations match current parser confidence.
- [ ] Raw copyrighted inputs are not staged for commit.

## Required Before Native Desktop Release

- [ ] Rust toolchain installed.
- [ ] `npm.cmd run tauri:build` passes on target OS.
- [ ] Generated data bundled and loads offline.
- [ ] Save upload remains read-only in packaged app.

## Required Before Mobile Release

- [ ] Java and Android SDK installed for Android.
- [ ] Xcode installed on macOS for iOS.
- [ ] `npm.cmd run cap:sync` passes.
- [ ] Android/iOS projects are generated and tested.
- [ ] File picker behavior works for local save files.

## Required Before Save Parsing Claims

- [ ] Clean save fixture exists.
- [ ] Played save fixture exists.
- [ ] Changed byte ranges documented.
- [ ] Party offset confirmed.
- [ ] PC storage offset confirmed.
- [ ] Checksums documented.
- [ ] `docs/SAVE_STRUCTURE.md` updated with evidence.
