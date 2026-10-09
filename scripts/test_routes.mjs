(async () => {
  const routes = ['/', '/personnel', '/settings/profile', '/settings/fields', '/login'];
  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r);
      console.log(r, '->', res.status);
    } catch (e) {
      console.log(r, 'FAILED:', e.message);
    }
  }
})();
