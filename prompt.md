📋 Prompt: Refine "Active Sale" State & Calculator Styling
Task: Polish the visual hierarchy of the POS screen when items are in the cart and held invoices exist. Reduce color noise and improve workflow clarity.
1. Tame the Calculator (Critical Visual Fix)
Issue: The bright orange operator keys (÷, ×, -, +, =) are too loud. They distract from the main task (selling) and clash with the Sage Green brand. Orange typically signals "Warning" or "Stop" in UI design.
Fix:
Change Color: Switch operator keys to a Soft Slate Blue (#64748B) or a Muted Sage (#86EFAC with dark text). This keeps them distinct from number keys but harmonious with the theme.
Equals Button: Make = the only "Action" key. Use the Primary Brand Green (#5A8F7B) to signal "Go/Calculate".
Clear Button: Keep C as a soft Red/Pink (#FECACA) to indicate destruction/reset.
Number Keys: Keep them neutral white/light gray.
2. Refine "Held Invoices" & "Hold Cart" Workflow
Issue: The yellow badge (Held Invoices 1) looks like an error alert. The "Hold Cart" button is passive.
Fix:
Badge Style: Change the "Held Invoices" badge to a Neutral Gray or Blue pill. It’s a utility count, not a warning. Only turn it Red/Yellow if a held invoice is expiring or overdue.
"Hold Cart" Button: Make this more prominent when the cart has items. Use an outline style with an icon (e.g., ️ Pause icon).
"Clear" Button: Move this to the far right or make it a text-only link with a trash icon. It’s a destructive action and shouldn't be next to "Hold Cart" where accidental clicks happen. Add a confirmation modal ("Are you sure?") before clearing.
3. Invoice Table Polish (The "Active" State)
Issue: The table row for "مسکه تازه حیوانی" is functional but dense.
Fix:
Quantity Input: The - 7 + stepper is good. Ensure the input field itself is Monospaced and centered.
Unit Badge: The "KG" badge is small. Make it slightly larger or use a light background pill so it’s readable at a glance.
Price Alignment: Ensure "400 AFN" and "2,800 AFN" are strictly right-aligned and use the same font weight.
Row Height: Increase row height slightly (h-16) to give touch targets (steppers, delete bin) more breathing room.
4. Checkout Panel: "Exact" Feature
Observation: I see an "Exact" tag next to "Cash Paid". This is brilliant for speed.
Enhancement:
Make "Exact" a clickable button/toggle. When clicked, it auto-fills the "Cash Paid" input with the "Total Payable" amount.
Visual Feedback: When "Exact" is active, highlight the "Cash Paid" input border in Green to confirm "No Change Needed".
5. Search Bar Context
Issue: The search bar shows "شیر خشک نیدو" (Nido Milk Powder) with an 'X' to clear.
Fix: Ensure that when a user selects an item from search results, the search bar auto-clears and re-focuses. The cashier should never have to manually click 'X' to scan the next item.