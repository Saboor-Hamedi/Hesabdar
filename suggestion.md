React has detected a change in the order of Hooks called by ReceiptModal. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useMemo                    useMemo
3. useMemo                    useMemo
4. useRef                     useRef
5. useCallback                useCallback
6. useRef                     useRef
7. useCallback                useCallback
8. useState                   useState
9. useSyncExternalStore       useSyncExternalStore
10. useEffect                 useEffect
11. useRef                    useRef
12. useRef                    useRef
13. useMemo                   useMemo
14. undefined                 useState
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

updateHookTypesDev @ react-dom_client.js?v=38b210d3:5858
useState @ react-dom_client.js?v=38b210d3:20741
exports.useState @ chunk-2XCFYVCW.js?v=38b210d3:984
ReceiptModal @ ReceiptModal.tsx:33
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooks @ react-dom_client.js?v=38b210d3:5918
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12800
performSyncWorkOnRoot @ react-dom_client.js?v=38b210d3:14651
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=38b210d3:14548
processRootScheduleInMicrotask @ react-dom_client.js?v=38b210d3:14571
(anonymous) @ react-dom_client.js?v=38b210d3:14665
<ReceiptModal>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
POSView @ POSView.tsx:392
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooksAgain @ react-dom_client.js?v=38b210d3:5995
renderWithHooks @ react-dom_client.js?v=38b210d3:5929
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12800
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=38b210d3:14639
performWorkUntilDeadline @ react-dom_client.js?v=38b210d3:36
<POSView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
renderContent @ AppShell.tsx:96
AppShell @ AppShell.tsx:172
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooksAgain @ react-dom_client.js?v=38b210d3:5995
renderWithHooks @ react-dom_client.js?v=38b210d3:5929
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12800
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=38b210d3:14639
performWorkUntilDeadline @ react-dom_client.js?v=38b210d3:36
<AppShell>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
(anonymous) @ main.tsx:15
react-dom_client.js?v=38b210d3:6058 Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom_client.js?v=38b210d3:6058:19)
    at updateReducer (react-dom_client.js?v=38b210d3:6158:20)
    at Object.useState (react-dom_client.js?v=38b210d3:20745:20)
    at exports.useState (chunk-2XCFYVCW.js?v=38b210d3:984:36)
    at ReceiptModal (ReceiptModal.tsx:33:35)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=38b210d3:20259:20)
    at renderWithHooks (react-dom_client.js?v=38b210d3:5918:24)
    at updateFunctionComponent (react-dom_client.js?v=38b210d3:7763:21)
    at beginWork (react-dom_client.js?v=38b210d3:8843:20)
    at runWithFiberInDEV (react-dom_client.js?v=38b210d3:1133:72)
updateWorkInProgressHook @ react-dom_client.js?v=38b210d3:6058
updateReducer @ react-dom_client.js?v=38b210d3:6158
useState @ react-dom_client.js?v=38b210d3:20745
exports.useState @ chunk-2XCFYVCW.js?v=38b210d3:984
ReceiptModal @ ReceiptModal.tsx:33
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooks @ react-dom_client.js?v=38b210d3:5918
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12861
performSyncWorkOnRoot @ react-dom_client.js?v=38b210d3:14651
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=38b210d3:14548
processRootScheduleInMicrotask @ react-dom_client.js?v=38b210d3:14571
(anonymous) @ react-dom_client.js?v=38b210d3:14665
<ReceiptModal>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
POSView @ POSView.tsx:392
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooksAgain @ react-dom_client.js?v=38b210d3:5995
renderWithHooks @ react-dom_client.js?v=38b210d3:5929
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12800
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=38b210d3:14639
performWorkUntilDeadline @ react-dom_client.js?v=38b210d3:36
<POSView>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
renderContent @ AppShell.tsx:96
AppShell @ AppShell.tsx:172
react_stack_bottom_frame @ react-dom_client.js?v=38b210d3:20259
renderWithHooksAgain @ react-dom_client.js?v=38b210d3:5995
renderWithHooks @ react-dom_client.js?v=38b210d3:5929
updateFunctionComponent @ react-dom_client.js?v=38b210d3:7763
beginWork @ react-dom_client.js?v=38b210d3:8843
runWithFiberInDEV @ react-dom_client.js?v=38b210d3:1133
performUnitOfWork @ react-dom_client.js?v=38b210d3:13598
workLoopSync @ react-dom_client.js?v=38b210d3:13461
renderRootSync @ react-dom_client.js?v=38b210d3:13445
performWorkOnRoot @ react-dom_client.js?v=38b210d3:12800
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=38b210d3:14639
performWorkUntilDeadline @ react-dom_client.js?v=38b210d3:36
<AppShell>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=38b210d3:255
(anonymous) @ main.tsx:15
POSView.tsx:392 An error occurred in the <ReceiptModal> component.
___
