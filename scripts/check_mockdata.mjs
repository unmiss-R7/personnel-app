import fs from 'fs';

const code = fs.readFileSync('lib/mockData.ts', 'utf8');
const match = code.match(/"seq_no":\s*274/);
console.log('Has seq_no 274 in mockData:', !!match);
if (match) {
  const idx = match.index;
  console.log(code.substring(idx - 100, idx + 400));
}
