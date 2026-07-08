// Condivisione delle impostazioni via URL: ogni binding espone get/set su un
// parametro; nel link finiscono solo i valori diversi dal default (catturato
// all'avvio), così l'URL resta corto. Al caricamento la query string viene
// riapplicata prima di costruire la GUI, che quindi nasce già allineata.

export function createShare(bindings) {
  const defaults = new Map(bindings.map((b) => [b.key, b.get()]));

  function parse(binding, raw) {
    const def = defaults.get(binding.key);
    if (typeof def === 'boolean') return raw === '1' || raw === 'true';
    if (typeof def === 'number') {
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : def;
    }
    return raw;
  }

  function applyFromURL() {
    const qs = new URLSearchParams(window.location.search);
    for (const b of bindings) {
      const raw = qs.get(b.key);
      if (raw !== null) b.set(parse(b, raw));
    }
  }

  function buildLink() {
    const qs = new URLSearchParams();
    for (const b of bindings) {
      const v = b.get();
      const def = defaults.get(b.key);
      if (v === def) continue;
      if (typeof v === 'boolean') qs.set(b.key, v ? '1' : '0');
      else if (typeof v === 'number') qs.set(b.key, String(Math.round(v * 1000) / 1000));
      else qs.set(b.key, String(v));
    }
    const base = window.location.origin + window.location.pathname;
    const q = qs.toString();
    return q ? `${base}?${q}` : base;
  }

  async function copyLink() {
    const link = buildLink();
    // tieni anche la barra degli indirizzi allineata
    window.history.replaceState(null, '', link);
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  }

  return { applyFromURL, buildLink, copyLink };
}
