// PDF legível e inteiramente fictício, para a verificação opt-in do Gemini e da UI.
import { mkdir, writeFile } from 'node:fs/promises';

const lines = [
  'CRLV - DOCUMENTO SINTETICO PARA TESTE - SEM VALIDADE',
  'CERTIFICADO DE REGISTRO E LICENCIAMENTO DE VEICULO',
  'PLACA: DQA1A23', 'CODIGO RENAVAM: 12345678901',
  'CHASSI: 9BWZZZ377VT004251', 'MARCA: Toyota', 'MODELO: Corolla',
  'ANO FABRICACAO: 2022', 'ANO MODELO: 2023', 'COR: Prata',
  'TIPO: Automovel', 'COMBUSTIVEL: Hibrido', 'CILINDRADA: 1800', 'UF: SP',
  'Todos os dados acima sao ficticios. Nenhum dado pessoal real.',
];
const content = `BT /F1 12 Tf 40 790 Td ${lines.map((line, i) => `${i ? '0 -32 Td ' : ''}(${line}) Tj`).join('\n')} ET`;
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
];
let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const fixture = new URL('../apps/api/test/fixtures/crlv-sintetico.pdf', import.meta.url);
await mkdir(new URL('.', fixture), { recursive: true });
await writeFile(fixture, pdf);
console.log('Fixture CRLV sintético gerado.');
