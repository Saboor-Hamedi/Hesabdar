
### 📋 Improved Prompt for Your Agent

**Task:** Standardize UI Layout & Table Behavior Across All Core Modules

**Scope:** Apply the following design system updates to **Sold, Products, Dashboard, Customers, Suppliers, and Reports** tabs.

**1. Unified Header & Stats Card System**
*   **Objective:** Create a single, reusable component structure for all page headers and stat cards to ensure pixel-perfect consistency.
*   **Layout:** Use a standardized CSS Grid or Flexbox layout for the header area.
    *   **Height:** Fix the header container height (e.g., `min-h-[120px]`) so it never collapses or shifts between pages.
    *   **Cards:** All stat cards must share identical dimensions (`w-full`, fixed height), padding (`p-6`), border-radius (`rounded-xl`), and shadow depth.
    *   **Typography:** Standardize Title (H3, Bold, Dark), Value (H1, Monospace, Primary Color), and Label (Small, Uppercase, Gray) across all cards.
    *   **Buttons/Actions:** Any action buttons in the header (e.g., "Export", "Add New") must use the same size, color, and icon alignment.
*   **Constraint:** Only the *content* (text, icons, numbers) should change. The *container* and *styling* must be identical clones.

**2. Advanced Table Architecture (Sticky & Full-Height)**
*   **Objective:** Implement a "Full-Viewport" table layout where only the data rows scroll, while the header and pagination remain fixed.
*   **Structure:**
    *   **Container:** The table wrapper must use `flex flex-col h-[calc(100vh - header_height)]` to fill remaining screen space without triggering a full-page scrollbar.
    *   **Sticky Header:** Apply `position: sticky; top: 0; z-index: 10;` to the `<thead>`. Add a subtle bottom border/shadow when scrolling to indicate separation.
    *   **Scrollable Body:** The `<tbody>` must be `overflow-y-auto` with `flex-1`. This ensures rows scroll independently.
    *   **Fixed Pagination:** Place the pagination controls in a dedicated footer bar at the bottom of the container, outside the scrollable area. It must always be visible.
*   **Spacing:** Maintain consistent padding above the table (e.g., `mt-6`) to separate it from the header cards.

**3. Responsive Integrity**
*   **No Horizontal Scroll:** Tables must handle overflow gracefully. Use `min-width` on columns but allow the table container to scroll horizontally *if necessary*, while keeping the vertical layout intact.
*   **Adaptive Heights:** On smaller screens, reduce card height or stack them, but *never* break the "Sticky Header + Fixed Pagination" table rule. The table must always occupy the available vertical space.

**Deliverable:** Refactor the shared layout components first, then apply them to all 6 specified tabs. Verify that resizing the browser window does not break the sticky header or card alignment.

***

### 💡 Why This Version Is Better

| Original Phrase | Improved Technical Directive | Why It Matters |
| :--- | :--- | :--- |
| "Exactly look the same" | "Reusable component structure... identical dimensions, padding, radius" | Prevents the agent from just copying CSS; forces modular code. |
| "Headers should be fixed on top" | "`position: sticky; top: 0; z-index: 10`" | Gives the exact CSS property needed for modern sticky headers. |
| "Table just scrolls like it's also fixed" | "`<tbody>` overflow-y-auto with flex-1" | Explains *how* to isolate scrolling to just the rows. |
| "No scroll to be scrolled up" | "Full-Viewport table layout... no full-page scrollbar" | Clarifies that the *page* shouldn't scroll, only the *data*. |
| "Preserve responsiveness" | "Adaptive heights... min-width on columns" | Defines what "responsive" means for a complex data table. |