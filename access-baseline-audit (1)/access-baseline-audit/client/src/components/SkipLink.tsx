/**
 * Visually hidden until focused. Must be the FIRST focusable element in
 * the DOM so a keyboard or screen-reader user's very first Tab press lets
 * them jump past repeated header/nav markup straight to page content.
 * This is the direct remediation for Audit Issue #3 (docs/accessibility-audit-report.md).
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
