/**
 * Client-side Anti-Inspect, Anti-DevTools & Source-Code Reader Protection
 * Protects all pages against right-click inspect, keyboard DevTools shortcuts,
 * third-party injected mobile/web inspectors (Eruda, vConsole, Chii, etc.),
 * and View-Source / Save-As scraping without affecting normal shopping UX or map drag.
 */

let initialized = false;

export function initCodeProtection(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || initialized) {
    return;
  }
  initialized = true;

  // 1. Disable Right-Click Context Menu on all pages
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  document.addEventListener('contextmenu', handleContextMenu, { capture: true });

  // 2. Disable all DevTools, Inspect Element, View Source & Save Page shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = (e.key || '').toUpperCase();
    const keyCode = e.keyCode || e.which;
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // F12
    if (key === 'F12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / J / C / K / E / M (Windows/Linux DevTools & Inspect)
    if (ctrlOrCmd && shift && ['I', 'J', 'C', 'K', 'E', 'M'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd+Option+I / J / C / U / K (macOS DevTools & Source)
    if (ctrlOrCmd && alt && ['I', 'J', 'C', 'U', 'K'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U (View Page Source) & Ctrl+S / Cmd+S (Save Webpage Source)
    if (ctrlOrCmd && ['U', 'S'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Shift+F10 (Context menu key)
    if ((shift && key === 'F10') || key === 'CONTEXTMENU' || keyCode === 93) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };
  window.addEventListener('keydown', handleKeyDown, { capture: true });

  // 3. Prevent image/link drag-saving while keeping Leaflet map drag untouched
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.leaflet-container')) return;
      if (target.tagName === 'IMG' || target.tagName === 'A') {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // 4. Block third-party mobile/browser inspector scripts (Eruda, vConsole, Weinre, Chii)
  const removeThirdPartyInspectors = () => {
    const blockedSelectors = [
      '#eruda',
      '.eruda-container',
      '#__vconsole',
      '.vc-switch',
      'script[src*="eruda"]',
      'script[src*="vconsole"]',
      'script[src*="chii"]',
      'script[src*="weinre"]',
    ];
    for (const sel of blockedSelectors) {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    }
    try {
      const w = window as unknown as Record<string, unknown>;
      if (w.eruda) delete w.eruda;
      if (w.VConsole) delete w.VConsole;
    } catch {}
  };

  removeThirdPartyInspectors();
  const observer = new MutationObserver(() => {
    removeThirdPartyInspectors();
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}
