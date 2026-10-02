export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__mark" aria-hidden="true">
          🚌
        </span>
        <span>Chennai Transit Status</span>
      </div>

      {/*
        Direct remediation for Audit Issue #1 (docs/accessibility-audit-report.md):
        any run of non-English script gets its own `lang` attribute so a
        screen reader switches its pronunciation engine correctly instead
        of reading Tamil script phonetically as English.
      */}
      <p className="site-header__tagline">
        <span lang="ta">வணக்கம்</span> — live status for city bus routes
      </p>

      <nav aria-label="Primary">
        <ul className="site-header__nav-list">
          <li>
            <a href="#main-content">Route status</a>
          </li>
          <li>
            <a href="https://mtcbus.tn.gov.in" target="_blank" rel="noreferrer">
              Official MTC site
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
