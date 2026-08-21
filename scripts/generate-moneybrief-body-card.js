const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'sources', 'moneybrief');

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && /^body-\d{2}\.json$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function splitDifference(value, maxChars = 31) {
  const text = String(value || '').trim();
  if (!text) return [''];
  if (text.length <= maxChars) return [text];

  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function validateComparison(config, sourceName) {
  const required = [
    ['title', config.title],
    ['left.label', config.left?.label],
    ['left.monthly', config.left?.monthly],
    ['left.annual', config.left?.annual],
    ['right.label', config.right?.label],
    ['right.monthly', config.right?.monthly],
    ['right.annual', config.right?.annual],
    ['difference', config.difference],
    ['note', config.note],
  ];

  const missing = required.filter(([, value]) => !String(value || '').trim()).map(([name]) => name);
  if (missing.length) throw new Error(`${sourceName}: 필수 필드 누락: ${missing.join(', ')}`);

  const limits = [
    ['title', config.title, 28],
    ['subtitle', config.subtitle, 44],
    ['left.label', config.left?.label, 18],
    ['right.label', config.right?.label, 18],
    ['left.monthly', config.left?.monthly, 16],
    ['right.monthly', config.right?.monthly, 16],
    ['left.annual', config.left?.annual, 20],
    ['right.annual', config.right?.annual, 20],
    ['difference', config.difference, 62],
    ['note', config.note, 86],
  ];

  const tooLong = limits.filter(([, value, max]) => String(value || '').length > max);
  if (tooLong.length) {
    throw new Error(`${sourceName}: 레이아웃 안전길이 초과: ${tooLong.map(([name, value, max]) => `${name}=${String(value).length}/${max}`).join(', ')}`);
  }

  const allText = JSON.stringify(config);
  const unitlessMan = allText.match(/\d+만(?!호|원|명|개|%|회|년|개월|㎡|km|톤|건)/g);
  if (unitlessMan) {
    throw new Error(`${sourceName}: 단위 없는 '만' 수치 발견: ${[...new Set(unitlessMan)].join(', ')}`);
  }
}

function renderComparison(config) {
  const title = config.title || '핵심 비교';
  const subtitle = config.subtitle || '';
  const left = config.left || {};
  const right = config.right || {};
  const difference = config.difference || '';
  const note = config.note || '';
  const field1Label = config.field1Label || '월 지원금';
  const field2Label = config.field2Label || '연 지원금';
  const differenceLines = splitDifference(difference);
  const differenceFontSize = differenceLines.length > 1 ? 24 : 27;
  const differenceY = differenceLines.length > 1 ? 35 : 56;

  const card = (x, label, rate, metric1, metric2, accent) => `
    <g transform="translate(${x},215)" filter="url(#shadow)">
      <rect width="430" height="270" rx="28" fill="#ffffff" stroke="${accent}" stroke-width="3"/>
      <rect width="430" height="72" rx="28" fill="${accent}"/>
      <rect y="44" width="430" height="28" fill="${accent}"/>
      <text x="45" y="49" class="kr label" fill="#ffffff">${escapeXml(label)}</text>
      <rect x="290" y="14" width="105" height="46" rx="23" fill="#ffffff" fill-opacity="0.18"/>
      <text x="342" y="49" text-anchor="middle" class="kr rate" fill="#ffffff">${escapeXml(rate)}</text>
      <circle cx="72" cy="135" r="35" fill="#eef7f8"/>
      <text x="72" y="149" text-anchor="middle" class="kr icon">₩</text>
      <text x="125" y="120" class="kr small">${escapeXml(field1Label)}</text>
      <text x="125" y="162" class="kr amount" fill="${accent}">${escapeXml(metric1)}</text>
      <line x1="35" y1="188" x2="395" y2="188" stroke="#dbe5ea" stroke-width="2"/>
      <circle cx="72" cy="230" r="35" fill="#eef7f8"/>
      <text x="72" y="244" text-anchor="middle" class="kr icon">✓</text>
      <text x="125" y="215" class="kr small">${escapeXml(field2Label)}</text>
      <text x="125" y="257" class="kr amount" fill="${accent}">${escapeXml(metric2)}</text>
    </g>`;

  const differenceText = differenceLines
    .map((line, index) => `<tspan x="118" dy="${index === 0 ? 0 : 31}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f5f9fa"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0a2342" flood-opacity="0.10"/>
    </filter>
    <style>
      .kr{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;}
      .title{font-size:58px;font-weight:900;fill:#071a3d;letter-spacing:-2.5px;}
      .subtitle{font-size:27px;font-weight:700;fill:#506579;}
      .label{font-size:30px;font-weight:900;letter-spacing:-1px;}
      .rate{font-size:28px;font-weight:900;}
      .small{font-size:21px;font-weight:700;fill:#30475e;}
      .amount{font-size:34px;font-weight:900;letter-spacing:-1px;}
      .icon{font-size:31px;font-weight:900;fill:#0b2752;}
      .difference{font-weight:900;fill:#0b6f78;}
      .note{font-size:18px;font-weight:600;fill:#6a7885;}
    </style>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <text x="600" y="88" text-anchor="middle" class="kr title">${escapeXml(title)}</text>
  <text x="600" y="132" text-anchor="middle" class="kr subtitle">${escapeXml(subtitle)}</text>
  <circle cx="600" cy="345" r="43" fill="#071a3d"/>
  <text x="600" y="356" text-anchor="middle" class="kr" font-size="28" font-weight="900" fill="#ffffff">VS</text>
  ${card(80, left.label || 'A', left.rate || '', left.monthly || '', left.annual || '', '#0b2d62')}
  ${card(690, right.label || 'B', right.rate || '', right.monthly || '', right.annual || '', '#0f9c9a')}
  <g transform="translate(180,520)" filter="url(#shadow)">
    <rect width="840" height="94" rx="24" fill="#ffffff" stroke="#16a7ad" stroke-width="3"/>
    <circle cx="58" cy="47" r="26" fill="#0f9c9a"/>
    <path d="M45 47 L54 56 L72 36" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="118" y="${differenceY}" class="kr difference" font-size="${differenceFontSize}">${differenceText}</text>
  </g>
  <text x="600" y="650" text-anchor="middle" class="kr note">※ ${escapeXml(note)}</text>
</svg>`;
}

const files = walk(ROOT);
if (!files.length) {
  console.log('MoneyBrief body card config files not found.');
  process.exit(0);
}

for (const jsonFile of files) {
  const config = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  if ((config.type || 'comparison') !== 'comparison') {
    throw new Error(`지원하지 않는 body card type: ${config.type}`);
  }
  validateComparison(config, path.relative(process.cwd(), jsonFile));
  const stem = path.basename(jsonFile, '.json').replace(/^body-/, '');
  const svgFile = path.join(path.dirname(jsonFile), `${stem}.svg`);
  fs.writeFileSync(svgFile, renderComparison(config), 'utf8');
  console.log(`Generated + source QA PASS: ${path.relative(process.cwd(), svgFile)}`);
}
