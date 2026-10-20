import fs from 'node:fs';
import path from 'node:path';

const userUploadedDir = 'C:/Users/tarun/.gemini/antigravity-ide/brain/386dd00d-661c-4c6a-a6f9-c194c7383434/.user_uploaded';

const mappings = [
  // Favicons & Google Search / Browser icons
  { src: 'media_1792492568501.png', dest: 'public/favicon-16x16.png' },
  { src: 'media_1792492568543.png', dest: 'public/favicon-32x32.png' },
  { src: 'media_1792492568543.png', dest: 'public/favicon.png' },
  { src: 'media_1792492568510.png', dest: 'public/favicon-48x48.png' },
  { src: 'media_1792492568493.png', dest: 'public/apple-touch-icon.png' },
  { src: 'media_1792492568493.png', dest: 'public/apple-touch-icon-180x180.png' },
  
  // PWA & Android / High-Res icons
  { src: 'media_1792492568485.png', dest: 'public/icon-192.png' },
  { src: 'media_1792492568485.png', dest: 'public/logo-192.png' },
  { src: 'media_1792492451020.png', dest: 'public/icon-512.png' },
  { src: 'media_1792492451020.png', dest: 'public/logo-512.png' },
  
  // Master High-Def Logos
  { src: 'media_1792492451217.png', dest: 'public/logo.png' },
  { src: 'media_1792492451217.png', dest: 'public/logo-mark.png' },
  { src: 'media_1792492451124.png', dest: 'public/logo-banner.png' },
  { src: 'media_1792492451124.png', dest: 'public/og-image.png' },
];

for (const { src, dest } of mappings) {
  const srcPath = path.join(userUploadedDir, src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dest);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.warn(`Warning: source file not found: ${srcPath}`);
  }
}

console.log('All logos organized successfully!');
