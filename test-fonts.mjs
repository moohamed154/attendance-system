import { jsPDF } from 'jspdf';
import fs from 'fs';
import https from 'https';

async function download(url, path) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return resolve(download(response.headers.location, path));
      }
      const file = fs.createWriteStream(path);
      response.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', reject);
  });
}

async function testFont(name, path) {
  try {
    const fontData = fs.readFileSync(path);
    const base64 = fontData.toString('base64');
    
    const pdf = new jsPDF();
    pdf.addFileToVFS(path, base64);
    pdf.addFont(path, name, 'normal');
    pdf.setFont(name, 'normal');
    
    pdf.text("Hello", 10, 10);
    console.log(`[PASS] ${name} parsed successfully.`);
  } catch (err) {
    console.log(`[FAIL] ${name} failed: ${err.message}`);
  }
}

async function run() {
  const fonts = [
    { name: 'Cairo', url: 'https://github.com/googlefonts/cairo/raw/main/fonts/ttf/Cairo-Regular.ttf', path: 'Cairo.ttf' },
    { name: 'Tajawal', url: 'https://github.com/googlefonts/tajawal/raw/main/fonts/ttf/Tajawal-Regular.ttf', path: 'Tajawal.ttf' },
    { name: 'Amiri', url: 'https://github.com/alif-type/amiri/raw/main/fonts/Amiri-Regular.ttf', path: 'Amiri.ttf' }
  ];

  for (const f of fonts) {
    if (!fs.existsSync(f.path)) {
      console.log(`Downloading ${f.name}...`);
      await download(f.url, f.path);
    }
    await testFont(f.name, f.path);
  }
}

run();
