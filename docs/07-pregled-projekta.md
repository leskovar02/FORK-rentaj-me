# Pregled prevzetega projekta

Pregled projekta Rentaj.me po menjavi. Pregledana je bila dokumentacija v `docs/` (zasnova, funkcionalnosti, podatkovni model, arhitektura, uporabniške zgodbe in ADR-ji), koda v `backend/` in `frontend/` ter testi.

## Implementirane funkcionalnosti MVP

Vseh sedem funkcionalnosti, ki so v [02-funkcionalnosti-in-obseg.md](02-funkcionalnosti-in-obseg.md) označene z [MVP], je implementiranih:

| # | Funkcionalnost | Stanje | Backend | Frontend |
|---|---|---|---|---|
| F1 | Katalog opreme z razpoložljivostjo po datumih | ✅ | `GET /api/oprema`, `GET /api/oprema/:id/zasedenost` | *Katalog*, *KosOpreme* (koledar) |
| F2 | Rezervacija s preverjanjem prekrivanja in pravil vloge | ✅ | `POST /api/rezervacije` (ena transakcija z zaklepanjem) | *Rezervacija* |
| F3 | Odobritev ali zavrnitev z obveznim razlogom | ✅ | `PATCH /api/rezervacije/:id/odobritev`, `/zavrnitev` | *TehnikOddane* |
| F4 | Izdaja in vračilo z beleženjem stanja | ✅ | `PATCH /api/rezervacije/:id/izdaja`, `/vracilo` | *TehnikOdobrene*, *TehnikIzdane*, *TehnikVracilo* |
| F5 | Samodejno označevanje zamujenih izposoj | ✅ | `GET /api/rezervacije?zamujene=true` (status se izračuna ob branju, ADR-0007) | *TehnikZamujene* |
| F6 | Pregled lastnih izposoj in statusov | ✅ | `GET /api/rezervacije/moje` | *MojeIzposoje* |
| F7 | Opozorila tehniku o zamudah in poškodbah | ✅ | `GET /api/rezervacije/:id/opozorila`, števci na seznamu | *TehnikOddane* |

Implementirane so tudi podporne funkcionalnosti, nujne za MVP:
- prijava in odjava (JWT v piškotku httpOnly);
- upravljanje uporabnikov (*AdminUporabniki*), kategorij (*AdminKategorije*) in opreme (*Inventar*).

Funkcionalnosti zunaj MVP (F8–F13) so implementirane le delno ali niso:

| # | Funkcionalnost | Stanje |
|---|---|---|
| F8 | Dolgoročna izposoja za profesorje | ⚠️ le backend (pravilo in preverjanje), v obrazcu ni možnosti |
| F9 | Preklic rezervacije | ❌ ni končne točke ne gumba (prehod `ODDANA → PREKLICANA` je le v modelu stanj) |
| F10 | Iskanje in filtriranje opreme | ❌ katalog je le razvrščen po kategorijah |
| F11 | Zapis in razreševanje poškodb | ⚠️ zapis o poškodbi ob vračilu obstaja, razreševanja ni |
| F12 | Zgodovina kosa opreme | ❌ |
| F13 | Upravljanje pravil izposoje | ⚠️ pravila se berejo iz baze (`GET /api/pravila/moje`), administratorskega urejanja ni |

## Ustreznost uporabniškim zgodbam (US-01 do US-05)

Pregledanih je prvih pet zgodb iz [05-uporabniske-zgodbe.md](05-uporabniske-zgodbe.md), ki pokrivajo jedro MVP. Za vsak kriterij sprejemljivosti je navedeno, kje v kodi ali testih je izpolnjen.

### US-01: Prijava in odjava ✅

| Kriterij | Izpolnjen | Dokaz |
|---|---|---|
| 1. Piškotek httpOnly z JWT, preusmeritev na začetno stran vloge | ✅ | `routes/auth.js`, `frontend/src/auth/vloge.js` (`zacetnaStran`), test `auth.test.js` |
| 2. Napačni podatki: 401 z enotnim sporočilom | ✅ | enak odgovor za neobstoječ naslov in napačno geslo, z zaščito pred časovnim napadom (`LAZNI_HASH`) |
| 3. Deaktiviran račun se ne more prijaviti | ✅ | vrne 403 s predpisanim sporočilom, a šele po pravilnem geslu, da se obstoj računa ne razkrije |
| 4. Zaščitene strani in API brez piškotka | ✅ | `ZascitenaPot.jsx`, `middleware/avtentikacija.js`, testi `GET /api/auth/jaz` |
| 5. Odjava izbriše piškotek | ✅ | `POST /api/auth/odjava`, test »izbriše piškotek« |

### US-02: Koledar zasedenosti kosa ✅

| Kriterij | Izpolnjen | Dokaz |
|---|---|---|
| 1. Mesečni koledar z dnevi `ODDANA`, `ODOBRENA`, `IZDANA` | ✅ | `components/Koledar.jsx`, `services/termini.js` (`zasedaKos`) |
| 2. `ZAVRNJENA`, `PREKLICANA`, `VRNJENA` ne zasedajo | ✅ | test `katalog.test.js` |
| 3. Brez podatkov o uporabniku in namenu | ✅ | odgovor vrača le `od` in `do`, test »odgovor ne vsebuje uporabnika, e-pošte ali namena« |
| 4. »V okvari« z onemogočenim gumbom, umaknjeni skriti | ✅ | `KarticaOpreme.jsx`, filter `status: { not: 'UMAKNJEN' }` |
| 5. Premikanje med meseci | ✅ | gumba »Prejšnji mesec« in »Naslednji mesec«, test `koledar.test.jsx` |

### US-03: Oddaja rezervacije s preverjanjem prekrivanja ✅

| Kriterij | Izpolnjen | Dokaz |
|---|---|---|
| 1. Validacija obrazca (400, označeno polje) | ✅ | Zod shema `oddajaShema`, napake po poljih (`napakePoPoljih`) |
| 2. Prekrivanje vrne 409 s kosom in terminom, brez delnih zapisov | ✅ | `preveriPrekrivanje` v transakciji, test »ob prekrivanju enega kosa ne nastane noben zapis« |
| 3. Kos, ki ni `NA_VOLJO`, se ne shrani | ✅ | `preveriKose` (409 z oznako kosa) |
| 4. Status `ODDANA`, postavka za vsak kos, potrdilo | ✅ | `oddajRezervacijo`, obvestilo v `ObrazecRezervacije.jsx` |
| 5. Hkratna oddaja: shrani se le ena | ✅ | zaklepanje `SELECT … FOR UPDATE` (ADR-0006), test `hkratnaOddaja.test.js` |

### US-04: Upoštevanje omejitev vloge ob oddaji ✅

| Kriterij | Izpolnjen | Dokaz |
|---|---|---|
| 1. Asistent do 20 aktivnih kosov | ✅ | `preveriSteviloKosov` šteje kose v `ODDANA`, `ODOBRENA` in `IZDANA` |
| 2. Preseženo število kosov: 400 s predpisanim sporočilom | ✅ | test »študent s 4 kosi dobi 400 z omejitvijo 3« |
| 3. Preseženo trajanje: 400 | ✅ | `preveriTrajanje`, test »7 koledarskih dni je dovoljeno, 8 vrne 400« |
| 4. Pravila se berejo iz `PraviloIzposoje` ob vsaki oddaji | ✅ | test »sprememba pravila velja takoj za naslednjo oddajo« |
| 5. Asistent nima dolgoročne izposoje, API vrne 403 | ✅ | API vrne 403; možnosti v obrazcu ni (je ni za nobeno vlogo, glej F8) |

### US-05: Odobritev oddane rezervacije ✅

| Kriterij | Izpolnjen | Dokaz |
|---|---|---|
| 1. Seznam oddanih od najstarejše z uporabnikom, kosi, terminom in namenom | ✅ | `seznamRezervacij` (`orderBy: ustvarjeno asc`), *TehnikOddane* |
| 2. Odobritev nastavi `ODOBRENA` in `obdelalId` | ✅ | `odobriRezervacijo`, test »oddano rezervacijo odobri in zapiše tehnika« |
| 3. Le iz `ODDANA`, sicer 409 | ✅ | tabela prehodov `PREHODI` v `services/statusi.js` |
| 4. Le `TEHNIK`, ostali 403 | ✅ | `zahtevajVlogo('TEHNIK')`, test »profesor ne more odobriti lastne rezervacije« |
| 5. Uporabnik vidi »Odobrena« | ✅ | *MojeIzposoje*, `StatusnaZnacka.jsx` |

**Sklep:** implementacija v celoti zadošča pregledanim zgodbam US-01 do US-05.

## Ugotovitve

- **Dokumentacija** je obsežna in usklajena s kodo. Arhitekturne odločitve so utemeljene v 13 ADR-jih, npr. zaklepanje pri oddaji, izračunan status »zamujena« in termini kot celi dnevi.
- **Arhitektura:** ločena frontend (React, Vite) in backend (Express, Prisma, PostgreSQL). Poslovna logika je v `backend/src/services/`, frontend pa API kliče prek enotne funkcije `klic()`.
- **Kakovost:** ESLint in Prettier sta nastavljena v obeh delih. Testov je več kot 300 (Vitest, Supertest, Testing Library). Backend testi tečejo na ločeni testni bazi.
- **Lokalni zagon** poteka z Docker Compose (`docker compose up -d` in `docker compose exec backend npm run db:seed`) po navodilih v README.
- **Pomanjkljivosti** so le pri funkcionalnostih zunaj MVP (F8–F13, glej zgoraj).
