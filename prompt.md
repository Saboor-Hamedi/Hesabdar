📋 Prompt: Fix Checkout Panel Overflow & "Exact" Badge Layout
Task: Refactor the Right Sidebar (Checkout Panel) to eliminate vertical scrolling and properly integrate the "Exact Settlement" feature. The panel must fit all elements perfectly within the viewport height without scrolling.
1. Fix the Layout Overflow (Critical)
Issue: The checkout section has a vertical scrollbar, causing the "Exact Settlement" badge to be hidden or cut off at the bottom.
Fix:
Change the checkout container to use flex flex-col with h-full (or flex-1).
Set the internal content wrapper to overflow-y-auto only if necessary, but ideally, adjust spacing so everything fits naturally.
Reduce Vertical Padding: Decrease the gap between "Subtotal", "Discount", and "Total Payable" from gap-4 (16px) to gap-2 (8px) or gap-3 (12px). These fields don't need that much breathing room.
Compact Inputs: Reduce the height of the "Discount" and "Cash Paid" inputs from h-12 (48px) to h-10 (40px). This saves ~16px of vertical space immediately.
2. Redesign the "Exact Settlement" Feature
Current Issue: The "Exact Settlement" box looks like a separate, floating card that gets pushed off-screen. It feels disconnected from the "Cash Paid" input.
Fix: Integrate it directly into the "Cash Paid" row.
Layout: Create a single row for payment: [Label: Cash Paid] [Input Field] [Exact Button].
The "Exact" Button: Instead of a large box below, make "Exact" a small, pill-shaped button or icon inside or next to the Cash Paid input.
Style: Small green badge with checkmark icon + text "Exact (تکمیل)".
Interaction: When clicked, it fills the input with the total and turns solid green.
Alternative (If keeping the box): If you prefer the box style, place it above the "Total Payable" line as a "Quick Actions" bar, or make it a collapsible section that only expands when the user clicks a "Payment Options" link.
3. Visual Hierarchy & Spacing
Total Payable: This is the most important number. Give it the most space. Increase its font size slightly and add mt-2 (margin-top) to separate it from the discount field.
Checkout Button: Ensure the "CHECKOUT (F12)" button is sticky at the bottom (mt-auto) so it’s always visible and clickable, even if the screen is resized.
Calculator: Ensure the calculator doesn't shrink too much. Set a min-height on the calculator container so the keys remain tappable.
4. Typography & Alignment
Numbers: Ensure "1,440 AFN" in Subtotal, Total, and Input are all Right-Aligned and use Monospaced Font.
Labels: "Subtotal", "Discount", "Total Payable", "Cash Paid" should be Left-Aligned and vertically centered with their respective values/inputs.