// CORS za frontend na drugem izvoru (produkcija: GitHub Pages, backend na Renderju). Dovoljen je
// le en izvor (FRONTEND_URL) s piškotki. Lokalno FRONTEND_URL ni nastavljen in frontend gre prek
// proxyja v Vite (ADR-0012), zato se middleware ne uporabi.
export function dovoliIzvor(izvor) {
  return (req, res, next) => {
    res.vary('Origin');
    if (req.headers.origin !== izvor) {
      return next();
    }

    res.set({
      'Access-Control-Allow-Origin': izvor,
      'Access-Control-Allow-Credentials': 'true',
    });

    // Preflight: brskalnik pred zahtevo z JSON telesom vpraša, ali je dovoljena.
    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      });
      return res.status(204).end();
    }
    next();
  };
}

const NAMERNA_NAPAKA = 'neuporabljena spremenljivka';
