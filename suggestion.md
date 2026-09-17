Run npx electron-builder --linux --publish always
  • electron-builder  version=26.15.3 os=6.17.0-1022-azure
  • loaded configuration  file=/home/runner/work/Hesabdar/Hesabdar/electron-builder.yml
  • skipped dependencies rebuild  reason=npmRebuild is set to false
  • packaging       platform=linux arch=x64 electron=39.8.10 appOutDir=dist/linux-unpacked
  • downloaded      label=electron progress=100%
  • downloaded electron zip extracted successfully  output=/home/runner/work/Hesabdar/Hesabdar/dist/linux-unpacked
  • searching for node modules  pm=npm searchDir=/home/runner/work/Hesabdar/Hesabdar
  • duplicate dependency references  dependencies=["debug@4.4.3","@types/node@22.20.3","@types/node@22.20.3","@types/responselike@1.0.3","@types/node@22.20.3","get-stream@5.2.0","responselike@2.0.1","debug@4.4.3","@types/node@22.20.3","debug@4.4.3","once@1.4.0","electron@39.8.10"]
  • building        target=AppImage arch=x64 file=dist/hesabdar-1.0.6.AppImage
  • electron uses desktopName as app_id / WM_CLASS for window association. Without it desktop environments may not link running windows to this .desktop entry. Set desktopName in package.json and linux.syncDesktopName: true to fix.  reason=desktopName is not set in package.json docs=https://www.electron.build/linux#window-association-desktopname--syncdesktopname
  • default Electron icon is used  reason=application icon is not set
  • downloaded      label=appimage-12.0.1.7z progress=100%
  • downloaded      label=7zip-linux-x64.tar.gz progress=100%
  • building embedded block map  file=dist/hesabdar-1.0.6.AppImage
  • building        target=deb arch=x64 file=dist/hesabdar-1.0.6.deb
  • publishing      publisher=Github (owner: Saboor-Hamedi, project: Hesabdar, version: 1.0.6)
  • adding autoupdate files for: deb  resourceDir=dist/linux-unpacked/resources
  • uploading       file=hesabdar-1.0.6.AppImage provider=github
  • electron uses desktopName as app_id / WM_CLASS for window association. Without it desktop environments may not link running windows to this .desktop entry. Set desktopName in package.json and linux.syncDesktopName: true to fix.  reason=desktopName is not set in package.json docs=https://www.electron.build/linux#window-association-desktopname--syncdesktopname
  • downloaded      label=fpm-1.17.0-ruby-3.4.3-linux-amd64.7z progress=100%
  • creating GitHub release  reason=release doesn't exist tag=v1.0.6 version=1.0.6
  • uploading       file=hesabdar-1.0.6.deb provider=github
  ⨯ Cannot cleanup: 

Error #1 --------------------------------------------------------------------------------
HttpError: 422 Unprocessable Entity
"method: post url: https://api.github.com/repos/Saboor-Hamedi/Hesabdar/releases\n\n          Data:\n          {\n  \"message\": \"Validation Failed\",\n  \"errors\": [\n    {\n      \"resource\": \"Release\",\n      \"code\": \"already_exists\",\n      \"field\": \"tag_name\"\n    }\n  ],\n  \"documentation_url\": \"https://docs.github.com/rest/releases/releases#create-a-release\",\n  \"status\": \"422\"\n}\n          "
Headers: {
  "date": "Thu, 17 Sep 2026 14:16:15 GMT",
  "content-type": "application/json; charset=utf-8",
  "content-length": "209",
  "x-github-media-type": "github.v3; format=json",
  "x-accepted-github-permissions": "contents=write; contents=write,workflows=write",
  "x-github-api-version-selected": "2022-11-28",
  "access-control-expose-headers": "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, X-GitHub-SSO, X-GitHub-Request-Id, Deprecation, Sunset, Warning",
  "access-control-allow-origin": "*",
  "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  "x-frame-options": "deny",
  "x-content-type-options": "nosniff",
  "x-xss-protection": "0",
  "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  "content-security-policy": "default-src 'none'",
  "vary": "Accept-Encoding, Accept, X-Requested-With",
  "server": "github.com",
  "x-ratelimit-limit": "5000",
  "x-ratelimit-remaining": "4941",
  "x-ratelimit-reset": "1789656724",
  "x-ratelimit-used": "59",
  "x-ratelimit-resource": "core",
  "x-github-request-id": "5400:3911CF:9D4A7F:B81EB8:6AABF62E",
  "x-github-edge-region": "westus3"
}
    at createHttpError (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:66:10)
    at IncomingMessage.<anonymous> (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:241:13)
    at IncomingMessage.emit (node:events:536:35)
    at endReadableNT (node:internal/streams/readable:1698:12)
    at processTicksAndRejections (node:internal/process/task_queues:82:21)

Error #2 --------------------------------------------------------------------------------
HttpError: 422 Unprocessable Entity
"method: post url: https://api.github.com/repos/Saboor-Hamedi/Hesabdar/releases\n\n          Data:\n          {\n  \"message\": \"Validation Failed\",\n  \"errors\": [\n    {\n      \"resource\": \"Release\",\n      \"code\": \"already_exists\",\n      \"field\": \"tag_name\"\n    }\n  ],\n  \"documentation_url\": \"https://docs.github.com/rest/releases/releases#create-a-release\",\n  \"status\": \"422\"\n}\n          "
Headers: {
  "date": "Thu, 17 Sep 2026 14:16:15 GMT",
  "content-type": "application/json; charset=utf-8",
  "content-length": "209",
  "x-github-media-type": "github.v3; format=json",
  "x-accepted-github-permissions": "contents=write; contents=write,workflows=write",
  "x-github-api-version-selected": "2022-11-28",
  "access-control-expose-headers": "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, X-GitHub-SSO, X-GitHub-Request-Id, Deprecation, Sunset, Warning",
  "access-control-allow-origin": "*",
  "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  "x-frame-options": "deny",
  "x-content-type-options": "nosniff",
  "x-xss-protection": "0",
  "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  "content-security-policy": "default-src 'none'",
  "vary": "Accept-Encoding, Accept, X-Requested-With",
  "server": "github.com",
  "x-ratelimit-limit": "5000",
  "x-ratelimit-remaining": "4941",
  "x-ratelimit-reset": "1789656724",
  "x-ratelimit-used": "59",
  "x-ratelimit-resource": "core",
  "x-github-request-id": "5400:3911CF:9D4A7F:B81EB8:6AABF62E",
  "x-github-edge-region": "westus3"
}
    at createHttpError (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:66:10)
    at IncomingMessage.<anonymous> (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:241:13)
    at IncomingMessage.emit (node:events:536:35)
    at endReadableNT (node:internal/streams/readable:1698:12)
    at processTicksAndRejections (node:internal/process/task_queues:82:21)  failedTask=build stackTrace=Error: Cannot cleanup: 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    Error #1 --------------------------------------------------------------------------------
HttpError: 422 Unprocessable Entity
"method: post url: https://api.github.com/repos/Saboor-Hamedi/Hesabdar/releases\n\n          Data:\n          {\n  \"message\": \"Validation Failed\",\n  \"errors\": [\n    {\n      \"resource\": \"Release\",\n      \"code\": \"already_exists\",\n      \"field\": \"tag_name\"\n    }\n  ],\n  \"documentation_url\": \"https://docs.github.com/rest/releases/releases#create-a-release\",\n  \"status\": \"422\"\n}\n          "
Headers: {
  "date": "Thu, 17 Sep 2026 14:16:15 GMT",
  "content-type": "application/json; charset=utf-8",
  "content-length": "209",
  "x-github-media-type": "github.v3; format=json",
  "x-accepted-github-permissions": "contents=write; contents=write,workflows=write",
  "x-github-api-version-selected": "2022-11-28",
  "access-control-expose-headers": "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, X-GitHub-SSO, X-GitHub-Request-Id, Deprecation, Sunset, Warning",
  "access-control-allow-origin": "*",
  "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  "x-frame-options": "deny",
  "x-content-type-options": "nosniff",
  "x-xss-protection": "0",
  "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  "content-security-policy": "default-src 'none'",
  "vary": "Accept-Encoding, Accept, X-Requested-With",
  "server": "github.com",
  "x-ratelimit-limit": "5000",
  "x-ratelimit-remaining": "4941",
  "x-ratelimit-reset": "1789656724",
  "x-ratelimit-used": "59",
  "x-ratelimit-resource": "core",
  "x-github-request-id": "5400:3911CF:9D4A7F:B81EB8:6AABF62E",
  "x-github-edge-region": "westus3"
}
    at createHttpError (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:66:10)
    at IncomingMessage.<anonymous> (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:241:13)
    at IncomingMessage.emit (node:events:536:35)
    at endReadableNT (node:internal/streams/readable:1698:12)
    at processTicksAndRejections (node:internal/process/task_queues:82:21)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    Error #2 --------------------------------------------------------------------------------
HttpError: 422 Unprocessable Entity
"method: post url: https://api.github.com/repos/Saboor-Hamedi/Hesabdar/releases\n\n          Data:\n          {\n  \"message\": \"Validation Failed\",\n  \"errors\": [\n    {\n      \"resource\": \"Release\",\n      \"code\": \"already_exists\",\n      \"field\": \"tag_name\"\n    }\n  ],\n  \"documentation_url\": \"https://docs.github.com/rest/releases/releases#create-a-release\",\n  \"status\": \"422\"\n}\n          "
Headers: {
  "date": "Thu, 17 Sep 2026 14:16:15 GMT",
  "content-type": "application/json; charset=utf-8",
  "content-length": "209",
  "x-github-media-type": "github.v3; format=json",
  "x-accepted-github-permissions": "contents=write; contents=write,workflows=write",
  "x-github-api-version-selected": "2022-11-28",
  "access-control-expose-headers": "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, X-GitHub-SSO, X-GitHub-Request-Id, Deprecation, Sunset, Warning",
  "access-control-allow-origin": "*",
  "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  "x-frame-options": "deny",
  "x-content-type-options": "nosniff",
  "x-xss-protection": "0",
  "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  "content-security-policy": "default-src 'none'",
  "vary": "Accept-Encoding, Accept, X-Requested-With",
  "server": "github.com",
  "x-ratelimit-limit": "5000",
  "x-ratelimit-remaining": "4941",
  "x-ratelimit-reset": "1789656724",
  "x-ratelimit-used": "59",
  "x-ratelimit-resource": "core",
  "x-github-request-id": "5400:3911CF:9D4A7F:B81EB8:6AABF62E",
  "x-github-edge-region": "westus3"
}
    at createHttpError (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:66:10)
    at IncomingMessage.<anonymous> (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util-runtime/src/httpExecutor.ts:241:13)
    at IncomingMessage.emit (node:events:536:35)
    at endReadableNT (node:internal/streams/readable:1698:12)
    at processTicksAndRejections (node:internal/process/task_queues:82:21)
    at throwError (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util/src/asyncTaskManager.ts:88:11)
    at checkErrors (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util/src/asyncTaskManager.ts:53:9)
    at AsyncTaskManager.awaitTasks (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util/src/asyncTaskManager.ts:58:5)
    at PublishManager.awaitTasks (/home/runner/work/Hesabdar/Hesabdar/node_modules/app-builder-lib/src/publish/PublishManager.ts:247:28)
    at /home/runner/work/Hesabdar/Hesabdar/node_modules/app-builder-lib/src/index.ts:151:32
    at executeFinally (/home/runner/work/Hesabdar/Hesabdar/node_modules/builder-util/src/promise.ts:23:9)
Error: Process completed with exit code 1.