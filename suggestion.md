Run npx electron-builder --win --publish always
  • electron-builder  version=26.15.3 os=10.0.26100
  • loaded configuration  file=D:\a\Hesabdar\Hesabdar\electron-builder.yml
  • skipped dependencies rebuild  reason=npmRebuild is set to false
  • packaging       platform=win32 arch=x64 electron=39.8.10 appOutDir=dist\win-unpacked
  • downloaded      label=electron progress=100%
  • downloaded electron zip extracted successfully  output=D:\a\Hesabdar\Hesabdar\dist\win-unpacked
  • searching for node modules  pm=npm searchDir=D:\a\Hesabdar\Hesabdar
  • duplicate dependency references  dependencies=["debug@4.4.3","@types/node@22.20.3","@types/node@22.20.3","@types/responselike@1.0.3","@types/node@22.20.3","get-stream@5.2.0","responselike@2.0.1","debug@4.4.3","@types/node@22.20.3","debug@4.4.3","once@1.4.0","electron@39.8.10"]
  • updating asar integrity executable resource  executablePath=dist\win-unpacked\hesabdar.exe
  ⨯ Application entry file "out\main\index.js" in the "D:\a\Hesabdar\Hesabdar\dist\win-unpacked\resources\app.asar" is corrupted: Error: "out\main\index.js" was not found in this archive  failedTask=build stackTrace=Error: Application entry file "out\main\index.js" in the "D:\a\Hesabdar\Hesabdar\dist\win-unpacked\resources\app.asar" is corrupted: Error: "out\main\index.js" was not found in this archive
    at error (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\asar\asarFileChecker.ts:7:12)
    at checkFileInArchive (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\asar\asarFileChecker.ts:16:11)
    at WinPackager.checkFileInPackage (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\platformPackager.ts:636:7)
    at WinPackager.sanityCheckPackage (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\platformPackager.ts:684:5)
    at WinPackager.doPack (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\platformPackager.ts:350:5)
    at WinPackager.pack (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\platformPackager.ts:163:5)
    at Packager.doBuild (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\packager.ts:530:11)
    at executeFinally (D:\a\Hesabdar\Hesabdar\node_modules\builder-util\src\promise.ts:12:14)
    at Packager.build (D:\a\Hesabdar\Hesabdar\node_modules\app-builder-lib\src\packager.ts:450:31)
    at executeFinally (D:\a\Hesabdar\Hesabdar\node_modules\builder-util\src\promise.ts:12:14)
Error: Process completed with exit code 1.
0s
