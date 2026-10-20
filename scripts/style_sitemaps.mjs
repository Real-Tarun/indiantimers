import fs from 'node:fs';

const styleHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

for (const file of ['public/sitemap-0.xml', 'public/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/sitemap-index.xml']) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('xml-stylesheet')) {
      content = content.replace(/<\?xml version="1\.0" encoding="UTF-8"\?>/, styleHeader);
      fs.writeFileSync(file, content, 'utf-8');
      console.log('Styled', file);
    }
  }
}

// Also create public/sitemap.xml as a copy of sitemap-0.xml
if (fs.existsSync('public/sitemap-0.xml')) {
  fs.copyFileSync('public/sitemap-0.xml', 'public/sitemap.xml');
  console.log('Created public/sitemap.xml');
}
if (fs.existsSync('dist/sitemap-0.xml')) {
  fs.copyFileSync('dist/sitemap-0.xml', 'dist/sitemap.xml');
  console.log('Created dist/sitemap.xml');
}
