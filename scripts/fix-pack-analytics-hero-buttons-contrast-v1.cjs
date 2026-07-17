const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'app', 'dashboard', 'comercial', 'pack-analytics', 'page.tsx');

if (!fs.existsSync(file)) {
  console.error(`[ERROR] No existe el archivo esperado: ${file}`);
  process.exit(1);
}

let src = fs.readFileSync(file, 'utf8');
const before = src;

const buttonClass = 'border-white/70 bg-white text-slate-950 shadow-sm hover:bg-slate-100 hover:text-slate-950 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white';

function ensureContrastClassForLink(source, href) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Case 1: Button already has a className. Merge only if our class was not added yet.
  source = source.replace(
    new RegExp(`(<Button\\s+asChild\\s+variant=["']outline["']\\s+className=["'])([^"']*)(["']>\\s*<Link\\s+href=["']${escapedHref}["'])`, 'm'),
    (_match, start, existing, end) => {
      if (existing.includes('text-slate-950') && existing.includes('dark:text-white')) return `${start}${existing}${end}`;
      return `${start}${`${existing} ${buttonClass}`.trim()}${end}`;
    }
  );

  // Case 2: Button has no className yet.
  source = source.replace(
    new RegExp(`(<Button\\s+asChild\\s+variant=["']outline["'])(>\\s*<Link\\s+href=["']${escapedHref}["'])`, 'm'),
    `$1 className="${buttonClass}"$2`
  );

  return source;
}

src = ensureContrastClassForLink(src, '/dashboard/comercial/kiosco');
src = ensureContrastClassForLink(src, '/dashboard/comercial/servicios-promociones');

if (src === before) {
  console.error('[ERROR] No se pudo aplicar el fix. Revisá si cambió el markup de los botones Open POS / Manage packs.');
  process.exit(1);
}

fs.writeFileSync(file, src, 'utf8');
console.log('[OK] Contraste de botones Open POS / Manage packs corregido en pack analytics.');
console.log('Patch aplicado. Ejecutá: rm -rf .next && npm run build');
