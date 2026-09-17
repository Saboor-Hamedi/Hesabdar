Run npx electron-builder --linux --publish always
  • electron-builder  version=26.15.3 os=6.17.0-1022-azure
  • loaded configuration  file=/home/runner/work/Hesabdar/Hesabdar/electron-builder.yml
  • skipped dependencies rebuild  reason=npmRebuild is set to false
  • packaging       platform=linux arch=x64 electron=39.8.10 appOutDir=dist/linux-unpacked
  • downloaded      label=electron progress=100%
  • downloaded electron zip extracted successfully  output=/home/runner/work/Hesabdar/Hesabdar/dist/linux-unpacked
  • searching for node modules  pm=npm searchDir=/home/runner/work/Hesabdar/Hesabdar
  • duplicate dependency references  dependencies=["debug@4.4.3","@types/node@22.20.3","@types/node@22.20.3","@types/responselike@1.0.3","@types/node@22.20.3","get-stream@5.2.0","responselike@2.0.1","debug@4.4.3","@types/node@22.20.3","debug@4.4.3","once@1.4.0","electron@39.8.10"]
  • building        target=AppImage arch=x64 file=dist/hesabdar-1.0.2.AppImage
  • building        target=snap arch=x64 file=dist/hesabdar_1.0.2_amd64.snap
  • electron uses desktopName as app_id / WM_CLASS for window association. Without it desktop environments may not link running windows to this .desktop entry. Set desktopName in package.json and linux.syncDesktopName: true to fix.  reason=desktopName is not set in package.json docs=https://www.electron.build/linux#window-association-desktopname--syncdesktopname
  • electron uses desktopName as app_id / WM_CLASS for window association. Without it desktop environments may not link running windows to this .desktop entry. Set desktopName in package.json and linux.syncDesktopName: true to fix.  reason=desktopName is not set in package.json docs=https://www.electron.build/linux#window-association-desktopname--syncdesktopname
  • downloading snap template  releaseName=snap-template-4.0-2
  • downloaded      label=snap-template-electron-4.0-2-amd64.tar.7z progress=100%
  • downloaded      label=appimage-12.0.1.7z progress=100%
  • downloaded      label=7zip-linux-x64.tar.gz progress=100%
  • publishing      publisher=Snap Store
  • uploading       file=hesabdar_1.0.2_amd64.snap provider=snapStore
  • building embedded block map  file=dist/hesabdar-1.0.2.AppImage
  • building        target=deb arch=x64 file=dist/hesabdar_1.0.2_amd64.deb
  • publishing      publisher=Github (owner: Saboor-Hamedi, project: Hesabdar, version: 1.0.2)
  • adding autoupdate files for: deb  resourceDir=dist/linux-unpacked/resources
  • uploading       file=hesabdar-1.0.2.AppImage provider=github
  • electron uses desktopName as app_id / WM_CLASS for window association. Without it desktop environments may not link running windows to this .desktop entry. Set desktopName in package.json and linux.syncDesktopName: true to fix.  reason=desktopName is not set in package.json docs=https://www.electron.build/linux#window-association-desktopname--syncdesktopname
  • downloaded      label=fpm-1.17.0-ruby-3.4.3-linux-amd64.7z progress=100%
  • uploading       file=hesabdar_1.0.2_amd64.deb provider=github
  ⨯ snapcraft is not installed, please: sudo snap install snapcraft --classic  failedTask=build stackTrace=Error: snapcraft is not installed, please: sudo snap install snapcraft --classic
    at checkSnapcraft (/home/runner/work/Hesabdar/Hesabdar/node_modules/electron-publish/src/snapStorePublisher.ts:90:11)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at SnapStorePublisher.upload (/home/runner/work/Hesabdar/Hesabdar/node_modules/electron-publish/src/snapStorePublisher.ts:24:5)
Error: Process completed with exit code 1.
