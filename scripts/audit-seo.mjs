async function auditSeo() {
  const url = 'http://localhost:4321/exams/neet-ug-2027/';
  const res = await fetch(url);
  const html = await res.text();

  const match = html.match(/<link rel=["']canonical["'][^>]*>/i);
  console.log('Canonical tag in HTML:', match ? match[0] : 'None');
}
auditSeo();
