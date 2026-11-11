import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales');

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('"hub"')) continue;
  const label = f === 'de.json' ? 'Bibliothek durchsuchen' : 'Search library';
  const block = `,\n    "hub": {\n      "searchPlaceholder": "${label}"\n    }`;
  const re = /("savedPlace":[^\n]+\n)(\s+\})/;
  if (!re.test(t)) {
    console.error('no match', f);
    continue;
  }
  t = t.replace(re, `$1${block}\n$2`);
  fs.writeFileSync(p, t);
  console.log('patched', f);
}
