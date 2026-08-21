const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'sources', 'moneybrief');
const POSTS = path.resolve(process.cwd(), 'posts', 'moneybrief');
const REPORT_DIR = path.resolve(process.cwd(), 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'moneybrief-visual-qa.json');

function walk(dir, matcher, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, matcher, out);
    else if (entry.isFile() && matcher(entry.name)) out.push(full);
  }
  return out;
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Invalid PNG: ${file}`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length };
}

const errors = [];
const checks = [];
const configs = walk(ROOT, name => /^body-\d{2}\.json$/i.test(name));

for (const configFile of configs) {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const rel = path.relative(ROOT, configFile).replace(/\\/g, '/');
  const slug = rel.split('/')[0];
  const stem = path.basename(configFile, '.json').replace(/^body-/, '');
  const png = path.join(POSTS, slug, `${stem}.png`);
  const item = { source: rel, png: path.relative(process.cwd(), png).replace(/\\/g, '/'), result: 'PASS', checks: [] };

  const textFields = [config.title, config.subtitle, config.difference, config.note, config.left?.label, config.left?.monthly, config.left?.annual, config.right?.label, config.right?.monthly, config.right?.annual].filter(Boolean);
  const unitless = JSON.stringify(textFields).match(/\d+만(?!호|원|명|개|%|회|년|개월|㎡|km|톤|건)/g);
  if (unitless) {
    item.result = 'FAIL';
    item.checks.push(`unit-missing:${[...new Set(unitless)].join(',')}`);
  } else item.checks.push('numeric-unit:PASS');

  if (String(config.difference || '').length > 62) {
    item.result = 'FAIL';
    item.checks.push(`difference-length:${String(config.difference).length}>62`);
  } else item.checks.push('difference-safe-area:PASS');

  if (!fs.existsSync(png)) {
    item.result = 'FAIL';
    item.checks.push('png-exists:FAIL');
  } else {
    const size = pngSize(png);
    item.pngMeta = size;
    if (size.width !== 1200 || size.height !== 675) {
      item.result = 'FAIL';
      item.checks.push(`png-dimension:${size.width}x${size.height}`);
    } else item.checks.push('png-dimension:PASS');
    if (size.bytes < 20000) {
      item.result = 'FAIL';
      item.checks.push(`png-bytes:${size.bytes}<20000`);
    } else item.checks.push('png-nonempty:PASS');
  }

  checks.push(item);
  if (item.result !== 'PASS') errors.push(item);
}

const report = {
  generatedAt: new Date().toISOString(),
  result: errors.length ? 'FAIL' : 'PASS',
  gate: 'SOURCE_PASS -> RENDER_PASS -> VISUAL_QA_PASS',
  policy: {
    publishRequiresHumanReview: true,
    checks: ['numeric-unit', 'difference-safe-area', 'png-exists', 'png-dimension', 'png-nonempty'],
    humanChecks: ['text-overlap', 'text-clipping', 'mobile-readability', 'source-number-match', 'search-description']
  },
  items: checks
};
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n');
console.log(`MoneyBrief visual QA: ${report.result} (${checks.length} body cards)`);
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
