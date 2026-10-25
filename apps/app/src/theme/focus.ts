export function installWebFocus(accent: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--focus', accent);
  const existing = document.getElementById('web-focus');
  if (existing) return;
  const style = document.createElement('style');
  style.id = 'web-focus';
  style.textContent = [
    ':focus-visible { outline: 2px solid var(--focus, #0E3B2E) !important; outline-offset: 2px; }',
    'html, body { overflow-x: hidden; }',
  ].join('\n');
  document.head.appendChild(style);
}
