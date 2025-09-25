const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: node extract-categories.js <path-to-pdf>');
    process.exit(1);
  }
  const abs = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(process.cwd(), pdfPath);
  const dataBuffer = fs.readFileSync(abs);
  const data = await pdf(dataBuffer);
  const text = data.text || '';

  // Split into lines, normalize
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // Heuristics: pick lines that look like section/category titles
  // - Short lines (<= 5 words)
  // - Start with capital letter or are ALL CAPS
  // - Exclude numeric-only or page numbers
  const candidates = new Set();
  for (const line of lines) {
    const words = line.split(' ');
    if (words.length === 0 || words.length > 6) continue;
    if (/^\d{1,3}$/.test(line)) continue; // page number
    if (/^\d+[.,]?\d*$/.test(line)) continue; // numeric
    const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
    const startsCapital = /^[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/.test(line);
    const looksLikeTitle = isAllCaps || startsCapital;
    if (!looksLikeTitle) continue;
    // Exclusions of common words
    if ([
      'SOMMAIRE','SOMMAIRE :','TABLE DES MATIÈRES','TABLE DES MATIERES','INDEX','CONTACT','CATALOGUE','PRIX','DIMENSIONS','CARACTÉRISTIQUES','CARACTERISTIQUES','GARANTIE','MENTIONS LÉGALES','MENTIONS LEGALES'
    ].includes(line.toUpperCase())) continue;

    candidates.add(line);
  }

  // Basic grouping into parent/child by simple prefixes we expect (example for Tables)
  const parents = new Set();
  const children = [];
  for (const c of candidates) {
    if (/^Table(s)?\b/i.test(c)) {
      parents.add('Tables');
      if (!/^Tables$/i.test(c)) children.push(['Tables', c]);
    } else if (/^Bureau(x)?\b/i.test(c)) {
      parents.add('Bureaux');
      if (!/^Bureaux$/i.test(c)) children.push(['Bureaux', c]);
    } else if (/^Chaise(s)?\b/i.test(c)) {
      parents.add('Chaises');
    } else if (/^Canap(e|é|és|és)?\b/i.test(c)) {
      parents.add('Canapés');
    } else if (/^Rideau(x)?\b/i.test(c)) {
      parents.add('Rideaux');
    } else if (/^Voilage(s)?\b/i.test(c)) {
      parents.add('Voilages');
    } else if (/^Store(s)?\b/i.test(c)) {
      parents.add('Stores');
    } else if (/^Accessoire(s)?\b/i.test(c)) {
      parents.add('Accessoires');
    } else if (/^D(é|e)cor(ation|ations)?\b/i.test(c)) {
      parents.add('Décoration');
    } else if (/^Tissu(x)?\b/i.test(c)) {
      parents.add('Tissus');
    }
  }

  const result = {
    parents: Array.from(parents).sort(),
    children: children
      .map(([p, c]) => ({ parent: p, name: c }))
      .filter((v, i, arr) => arr.findIndex(w => w.parent === v.parent && w.name === v.name) === i)
      .sort((a, b) => a.parent.localeCompare(b.parent) || a.name.localeCompare(b.name))
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


