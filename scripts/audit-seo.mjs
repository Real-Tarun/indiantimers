async function auditSeo() {
  const url = 'https://indiantimers.com/exams/neet-ug-2027/';
  try {
    const res = await fetch(url);
    const html = await res.text();

    console.log('HTTP Status:', res.status);
    console.log('Contains Event description:', html.includes('"description":"The single gateway'));
    console.log('Contains Event image:', html.includes('og-image.png'));
    console.log('Contains Event performer:', html.includes('"performer":{"@type":"Organization"'));
    console.log('Contains Event offers:', html.includes('"offers":{"@type":"Offer"'));
    console.log('Contains Event attendance mode:', html.includes('OfflineEventAttendanceMode'));
  } catch (err) {
    console.error('Audit failed:', err);
  }
}
auditSeo();

