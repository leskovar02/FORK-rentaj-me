// Sestavi Express aplikacijo. Tu ni app.listen(), da lahko testi (I-39) uvozijo
// aplikacijo brez zagona strežnika. Vrstni red middleware je pomemben.
import express from 'express';
import cookieParser from 'cookie-parser';
import { router } from './routes/index.js';
import { neznanaPot, obdelajNapako } from './middleware/napake.js';
import { dovoliIzvor } from './middleware/cors.js';

export const app = express();

// V produkciji je frontend na drugem izvoru (glej middleware/cors.js).
if (process.env.FRONTEND_URL) {
  app.use(dovoliIzvor(process.env.FRONTEND_URL));
}

app.use(express.json()); // telo zahteve → req.body
app.use(cookieParser()); // piškotki → req.cookies (JWT v I-05)

app.use('/api', router);
app.use('/api', neznanaPot); // za routerjem: ujame, česar router ni obdelal

app.use(obdelajNapako); // zadnji: ujame napake iz vsega zgoraj
