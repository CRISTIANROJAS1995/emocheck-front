const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Pantalla de plan de intervenci\u00f3n (Salud mental).rtf');
const content = fs.readFileSync(filePath, 'latin1');

// State machine RTF parser
const charMap = {
  'd3': '\u00d3', 'f3': '\u00f3', 'e9': '\u00e9', 'ed': '\u00ed',
  'fa': '\u00fa', 'e1': '\u00e1', 'f1': '\u00f1', 'c9': '\u00c9',
  'cd': '\u00cd', 'da': '\u00da', 'c1': '\u00c1', 'd1': '\u00d1',
  '93': '\u201c', '94': '\u201d', '96': '\u2013', 'fc': '\u00fc',
  'bf': '\u00bf', 'e0': '\u00e0', 'f2': '\u00f2', 'ba': '\u00ba',
  'aa': '\u00aa', 'b0': '\u00b0'
};

let output = [];
// Groups stack to skip header/styling groups
let groupDepth = 0;
let skipDepth = null; // depth at which we entered a skip group
let i = 0;
const len = content.length;

// Skip RTF header entirely until first \pard outside a nested group
// Simpler: just collect all text characters, decode escapes
while (i < len) {
  const ch = content[i];

  if (ch === '{') {
    groupDepth++;
    i++;
    // Check if next token is \* (destination to ignore)
    if (i < len && content[i] === '\\' && content[i+1] === '*') {
      skipDepth = groupDepth;
    }
  } else if (ch === '}') {
    if (skipDepth !== null && groupDepth === skipDepth) {
      skipDepth = null;
    }
    groupDepth--;
    i++;
  } else if (ch === '\\') {
    i++;
    if (i >= len) break;
    const next = content[i];

    if (next === "'") {
      // Hex char
      i++;
      const hex = content.slice(i, i + 2).toLowerCase();
      i += 2;
      if (!skipDepth) {
        output.push(charMap[hex] || '');
      }
    } else if (next === '\n' || next === '\r') {
      // Escaped newline = paragraph
      if (!skipDepth) output.push('\n');
      i++;
    } else if (next === '\\' || next === '{' || next === '}') {
      if (!skipDepth) output.push(next);
      i++;
    } else if (next === '~') {
      if (!skipDepth) output.push('\u00a0');
      i++;
    } else if (next === '-') {
      if (!skipDepth) output.push('\u00ad');
      i++;
    } else {
      // Control word
      let word = '';
      while (i < len && /[a-zA-Z]/.test(content[i])) {
        word += content[i++];
      }
      // Optional numeric param
      let num = '';
      if (i < len && (content[i] === '-' || /[0-9]/.test(content[i]))) {
        while (i < len && /[0-9\-]/.test(content[i])) {
          num += content[i++];
        }
      }
      // Consume trailing space delimiter
      if (i < len && content[i] === ' ') i++;

      if (!skipDepth) {
        if (word === 'par' || word === 'pard') {
          output.push('\n');
        } else if (word === 'line') {
          output.push('\n');
        } else if (word === 'tab') {
          output.push('\t');
        } else if (word === 'cell' || word === 'row') {
          output.push('\n');
        }
      }
    }
  } else {
    if (!skipDepth && ch !== '\r' && ch !== '\n' && ch !== '\0') {
      output.push(ch);
    }
    i++;
  }
}

let text = output.join('');
// Clean up
text = text.replace(/[ \t]+/g, ' ');
const lines = text.split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 4 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(l));

const result = lines.join('\n');
fs.writeFileSync('rtf-extracted.txt', result, 'utf8');
console.log(`Extracted ${lines.length} lines. Saved to rtf-extracted.txt`);
