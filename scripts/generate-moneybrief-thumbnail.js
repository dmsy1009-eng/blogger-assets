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
    else if (entry.isFile() && entry.name === 'thumbnail.json') out.push(full);
  }
  return out;
}

function accentText(line, accent) {
  const safeLine = escapeXml(line);
  if (!accent || !line.includes(accent)) return safeLine;
  const idx = line.indexOf(accent);
  const before = escapeXml(line.slice(0, idx));
  const target = escapeXml(accent);
  const after = escapeXml(line.slice(idx + accent.length));
  return `${before}<tspan fill="#0f9c9a">${target}</tspan>${after}`;
}

function badge(x, width, icon, label) {
  return `
    <g transform="translate(${x},565)">
      <rect x="0" y="0" width="${width}" height="62" rx="20" fill="#ffffff" stroke="#dbe5ea" stroke-width="2" filter="url(#shadowSmall)"/>
      <circle cx="33" cy="31" r="20" fill="#0f9c9a"/>
      <text x="33" y="38" text-anchor="middle" class="icon">${escapeXml(icon)}</text>
      <text x="62" y="39" class="badgeText">${escapeXml(label)}</text>
    </g>`;
}

function render(config) {
  const brand = config.brand || '머니브리프';
  const headline = Array.isArray(config.headline) ? config.headline.slice(0, 2) : [config.title || '머니브리프', ''];
  const line1 = headline[0] || '';
  const line2 = headline[1] || '';
  const accent = config.accent || '';
  const subtitle = config.subtitle || '';
  const badges = Array.isArray(config.badges) ? config.badges.slice(0, 3) : [];
  while (badges.length < 3) badges.push('핵심정보');
  const calendarYear = config.calendarYear || '2026년';
  const calendarMonth = String(config.calendarMonth || '12');
  const calendarLabel = config.calendarLabel || `${calendarMonth}월`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f3f8fa"/>
    </linearGradient>
    <linearGradient id="navy" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#071a3d"/>
      <stop offset="1" stop-color="#0c2d62"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f9c9a"/>
      <stop offset="1" stop-color="#087978"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0a2342" flood-opacity="0.14"/>
    </filter>
    <filter id="shadowSmall" x="-20%" y="-30%" width="140%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#0a2342" flood-opacity="0.10"/>
    </filter>
    <style>
      .kr{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;}
      .headline{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;font-weight:900;fill:#071a3d;font-size:68px;letter-spacing:-3px;}
      .subtitle{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;font-weight:800;fill:#0b2752;font-size:35px;letter-spacing:-1.5px;}
      .badgeText{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;font-weight:700;fill:#0b2752;font-size:17px;letter-spacing:-0.7px;}
      .icon{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;font-weight:900;fill:#ffffff;font-size:18px;}
    </style>
  </defs>

  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1000" cy="305" r="250" fill="#eaf6f8"/>
  <path d="M935 205 L1050 135 L1160 205" fill="none" stroke="#d1e1e9" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <g opacity="0.65" stroke="#d1e1e9" stroke-width="9">
    <line x1="965" y1="213" x2="965" y2="315"/>
    <line x1="1010" y1="213" x2="1010" y2="315"/>
    <line x1="1055" y1="213" x2="1055" y2="315"/>
    <line x1="1100" y1="213" x2="1100" y2="315"/>
    <line x1="938" y1="318" x2="1128" y2="318"/>
  </g>

  <g transform="translate(32,28)" filter="url(#shadowSmall)">
    <path d="M0 0 H298 Q320 0 320 22 V58 Q320 80 298 80 H0 Z" fill="url(#navy)"/>
    <rect width="8" height="80" fill="#11b3ad"/>
    <g transform="translate(28,18)" fill="none" stroke="#ffffff" stroke-width="4" stroke-linejoin="round">
      <path d="M0 0 H26 L38 12 V44 H0 Z"/>
      <path d="M26 0 V12 H38"/>
      <path d="M9 24 H29 M9 33 H29"/>
    </g>
    <text x="82" y="54" class="kr" font-size="35" font-weight="900" fill="#ffffff">${escapeXml(brand)}</text>
  </g>

  <text x="38" y="250" class="headline">${escapeXml(line1)}</text>
  <text x="38" y="356" class="headline">${accentText(line2, accent)}</text>
  <text x="38" y="445" class="subtitle">${escapeXml(subtitle)}</text>
  <path d="M120 472 C220 462, 305 466, 390 470" fill="none" stroke="#0f9c9a" stroke-width="7" stroke-linecap="round"/>

  ${badge(38, 215, '▣', badges[0])}
  ${badge(268, 295, '✓', badges[1])}
  ${badge(578, 190, '▥', badges[2])}

  <g transform="translate(785,150)" filter="url(#shadow)">
    <rect x="0" y="42" width="270" height="345" rx="26" fill="#ffffff" stroke="#d7e3ea" stroke-width="3"/>
    <path d="M0 68 Q0 42 26 42 H244 Q270 42 270 68 V112 H0 Z" fill="url(#navy)"/>
    <g fill="none" stroke="#6f8395" stroke-width="9">
      <path d="M48 50 V18 Q48 0 64 0 Q80 0 80 18 V50"/>
      <path d="M116 50 V18 Q116 0 132 0 Q148 0 148 18 V50"/>
      <path d="M184 50 V18 Q184 0 200 0 Q216 0 216 18 V50"/>
    </g>
    <text x="135" y="157" text-anchor="middle" class="kr" font-size="28" font-weight="800" fill="#0b2752">${escapeXml(calendarYear)}</text>
    <text x="135" y="285" text-anchor="middle" class="kr" font-size="112" font-weight="900" fill="#0f9c9a">${escapeXml(calendarMonth)}</text>
    <rect x="70" y="305" width="130" height="60" rx="18" fill="url(#teal)"/>
    <text x="135" y="346" text-anchor="middle" class="kr" font-size="30" font-weight="900" fill="#ffffff">${escapeXml(calendarLabel)}</text>
  </g>

  <g transform="translate(970,365)" filter="url(#shadowSmall)">
    <rect x="0" y="0" width="175" height="220" rx="18" fill="#ffffff" stroke="#0b2752" stroke-width="7"/>
    <rect x="55" y="-15" width="65" height="30" rx="8" fill="#6e8194"/>
    <g fill="none" stroke="#0f9c9a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 58 l11 11 l22 -25"/>
      <path d="M28 112 l11 11 l22 -25"/>
      <path d="M28 166 l11 11 l22 -25"/>
    </g>
    <g stroke="#0b2752" stroke-width="7" stroke-linecap="round">
      <line x1="75" y1="58" x2="145" y2="58"/>
      <line x1="75" y1="112" x2="145" y2="112"/>
      <line x1="75" y1="166" x2="145" y2="166"/>
    </g>
  </g>

  <g transform="translate(790,495)" filter="url(#shadowSmall)">
    <rect x="0" y="28" width="160" height="110" rx="14" fill="url(#teal)" transform="rotate(-5 80 83)"/>
    <text x="80" y="83" text-anchor="middle" class="kr" font-size="22" font-weight="900" fill="#ffffff" transform="rotate(-5 80 83)">청년미래적금</text>
    <path d="M34 107 H126" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
  </g>

  <g transform="translate(900,515)" filter="url(#shadowSmall)">
    <ellipse cx="62" cy="64" rx="66" ry="57" fill="#0f9c9a"/>
    <circle cx="104" cy="52" r="28" fill="#0f9c9a"/>
    <polygon points="87,26 97,0 112,30" fill="#0f9c9a"/>
    <circle cx="116" cy="48" r="4" fill="#071a3d"/>
    <ellipse cx="119" cy="61" rx="12" ry="9" fill="#7fd0ce"/>
    <circle cx="115" cy="61" r="2.5" fill="#071a3d"/>
    <circle cx="123" cy="61" r="2.5" fill="#071a3d"/>
    <rect x="20" y="110" width="18" height="25" rx="5" fill="#0f9c9a"/>
    <rect x="74" y="110" width="18" height="25" rx="5" fill="#0f9c9a"/>
    <rect x="38" y="18" width="44" height="6" rx="3" fill="#087978"/>
  </g>

  <g transform="translate(1060,560)" filter="url(#shadowSmall)">
    <ellipse cx="58" cy="80" rx="38" ry="12" fill="#d89d21"/>
    <rect x="20" y="22" width="76" height="58" fill="#f3b83f"/>
    <ellipse cx="58" cy="22" rx="38" ry="12" fill="#ffd76f"/>
    <ellipse cx="58" cy="42" rx="38" ry="12" fill="#ffd76f"/>
    <ellipse cx="58" cy="62" rx="38" ry="12" fill="#ffd76f"/>
    <ellipse cx="58" cy="80" rx="38" ry="12" fill="#ffd76f"/>
    <circle cx="8" cy="84" r="30" fill="#f3b83f" stroke="#d28f19" stroke-width="4"/>
    <text x="8" y="95" text-anchor="middle" class="kr" font-size="29" font-weight="900" fill="#fff6d8">₩</text>
  </g>
</svg>`;
}

const files = walk(ROOT);
if (!files.length) {
  console.log('MoneyBrief thumbnail.json files not found.');
  process.exit(0);
}

for (const jsonFile of files) {
  const config = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const svgFile = path.join(path.dirname(jsonFile), '01.svg');
  fs.writeFileSync(svgFile, render(config), 'utf8');
  console.log(`Generated: ${path.relative(process.cwd(), svgFile)}`);
}
