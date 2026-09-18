📋 Prompt: Dual-Calendar Header Component (Gregorian + Shamsi)
Task: Implement a robust, dual-calendar date picker integrated directly into the application header, positioned immediately to the left of the window control buttons (Minimize/Maximize/Close).
1. Location & Layout (Header Integration)
Placement: Insert the date selector in the top-right corner of the main window title bar or header strip. It must sit between the main navigation tabs/breadcrumbs and the system window controls (— □ ✕).
Style: Use a compact, pill-shaped trigger button.
Content: Display current date in short format: 17 Sept 2026 | 26 Sunbula 1405.
Icon: Include a small calendar icon on the left.
Interaction: Clicking opens a floating dropdown/popover (z-index high enough to overlay content but below system modals).
2. Dual-Calendar Logic (The Core Feature)
Synchronization: The calendar must display two synchronized views side-by-side or toggleable via a tab switcher inside the dropdown:
View A (Gregorian): Standard Western calendar.
View B (Solar Hijri/Shamsi): Accurate Persian/Afghan calendar.
Accuracy: Use a reliable library (e.g., jalaali-js, moment-jalaali, or date-fns-jalali) to ensure leap year calculations and month lengths (e.g., Esfand being 29 or 30 days) are mathematically correct for the current year.
Month Names: Display Shamsi months in Dari/Pashto (Hamal, Sawr, Jawza, Saratan, Asad, Sunbula, Mizan, Aqrab, Qaws, Jadi, Dalw, Hut).
3. "Robust" Functionality Requirements
Quick Selectors: Inside the dropdown, include "Today", "Yesterday", "This Week", "This Month (Shamsi)", and "This Month (Gregorian)" quick-action buttons at the top.
Range Selection: Allow selecting a date range (Start Date → End Date) for reports, not just a single day. Highlight the range visually in both calendars simultaneously.
Input Flexibility: Allow manual typing in the input field. Support formats like 1405/06/26 (Shamsi) or 2026-09-17 (Gregorian) and auto-parse them.
Visual Distinction:
Gregorian View: Clean white/gray theme.
Shamsi View: Subtle green tint or distinct border to visually signal "Local Calendar" mode.
Current Day: Highlighted with the primary brand color (Sage Green).
4. Technical Constraints
Responsiveness: If the screen is too narrow (tablet/mobile), the dropdown should expand to full width or stack the two calendars vertically instead of side-by-side.
Persistence: Remember the user's last selected view (Gregorian vs. Shamsi) in local storage so it defaults to their preference next time.
No External Dependencies (Optional): If possible, use native JS Date objects with a lightweight conversion utility to avoid bloating the bundle, unless a library is strictly necessary for Shamsi accuracy.
Deliverable: A reusable <DualCalendarPicker /> component placed in the Header layout. Verify that selecting a date updates the global report filters immediately.
