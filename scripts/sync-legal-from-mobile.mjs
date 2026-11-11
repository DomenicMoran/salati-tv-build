#!/usr/bin/env node
/** Copies datenschutz + impressum blocks from mobile locales into TV bundle data. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..', '..');
const mobileDir = path.join(root, 'apps', 'mobile', 'src', 'locales');
const locales = ['ar', 'bn', 'de', 'en', 'es', 'fa', 'fr', 'id', 'ms', 'ps', 'ru', 'sw', 'tr', 'ur'];
const out = {};

for (const loc of locales) {
  const file = path.join(mobileDir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!json.datenschutz || !json.impressum) {
    throw new Error(`Missing datenschutz/impressum in ${file}`);
  }
  out[loc] = { datenschutz: json.datenschutz, impressum: json.impressum };
}

const target = path.join(__dirname, '..', 'src', 'data', 'legal-from-mobile.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out));
console.log(`Wrote ${target} (${locales.length} locales).`);
