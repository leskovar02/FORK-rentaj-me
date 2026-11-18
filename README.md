# Rentaj.me

[![CI/CD](https://github.com/leskovar02/FORK-rentaj-me/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/leskovar02/FORK-rentaj-me/actions/workflows/ci-cd.yml)

**Nameščena aplikacija:** <https://leskovar02.github.io/FORK-rentaj-me/> (backend: <https://rentaj-me-api.onrender.com/api/zdravje>)

Prijava je mogoča z [testnimi računi](#testni-računi), npr. `student@rentaj.test` / `student123`. Brezplačni backend na Renderju po 15 minutah nedejavnosti zaspi, zato prva zahteva traja do ene minute.

Spletni sistem za izposojo opreme na oddelku za tehniko.

Študenti, asistenti in profesorji v katalogu poiščejo opremo (mikrokrmilnike, senzorje, merilne instrumente, kamere, VR očala, 3D tiskalnike …), preverijo njeno zasedenost in oddajo rezervacijo. Tehnik oddelka rezervacije odobrava, opremo izdaja in prevzema ter beleži njeno stanje in morebitne poškodbe. Sistem samodejno prikaže zamujena vračila, administrator pa upravlja uporabnike, kategorije opreme in pravila izposoje.

## Tehnologije

| Področje | Tehnologije |
|---|---|
| **Frontend** | React, Vite, React Router, Tailwind CSS |
| **Backend** | Node.js, Express, Zod |
| **Podatkovna baza** | PostgreSQL, Prisma ORM |
| **Avtentikacija** | JWT v piškotku httpOnly, bcrypt |
| **Lokalni razvoj** | Docker, Docker Compose |
| **Testi in CI** | Vitest, Supertest, ESLint, Prettier, GitHub Actions |

## Struktura repozitorija

```
├── frontend/   # React aplikacija
├── backend/    # Express REST API
├── .github/    # CI/CD (GitHub Actions)
└── docs/       # dokumentacija projekta
```

## Lokalni zagon

Potrebuješ [Git](https://git-scm.com/) in [Docker](https://docs.docker.com/get-docker/) z Docker Compose. Node.js na računalniku ni potreben.

1. Prenesi repozitorij:

   ```bash
   git clone https://github.com/Topolinjak/rentaj-me.git
   cd rentaj-me
   ```

2. Kopiraj predlogo nastavitev in jo po potrebi prilagodi:

   ```bash
   cp .env.example .env
   ```

   Če so vrata `5432` na tvojem računalniku že zasedena, v `.env` nastavi drug `DB_PORT` (npr. `5433`) in ista vrata uporabi v `DATABASE_URL`. Če so zasedena vrata `3000`, nastavi `BACKEND_PORT` (npr. `3001`).

3. Zaženi sistem (prvi zagon zgradi slike in traja nekaj minut):

   ```bash
   docker compose up -d
   ```

   Ob zagonu backend uveljavi migracije (`prisma migrate deploy`) in generira Prisma odjemalca. Spremembe kode v `backend/` ga samodejno ponovno zaženejo.

4. Preveri, ali sta baza in backend pripravljena (stanje `healthy`):

   ```bash
   docker compose ps
   curl http://localhost:3000/api/zdravje   # vrata BACKEND_PORT iz .env
   ```

   Frontend je na <http://localhost:5173>. Razvojni strežnik Vite zahteve na `/api` posreduje backendu (proxy, ADR-0012), zato `curl http://localhost:5173/api/zdravje` vrne isto. Spremembe kode v `frontend/` se v brskalniku prikažejo takoj. Če so vrata `5173` zasedena, nastavi `FRONTEND_PORT`.

5. Naloži začetne podatke (testni uporabniki, pravila izposoje, kategorije in oprema). Skripta je idempotentna, zato jo lahko poženeš večkrat:

   ```bash
   docker compose exec backend npm run db:seed
   ```

6. Odpri <http://localhost:5173> in se prijavi z enim od [testnih računov](#testni-računi), npr. `student@rentaj.test` / `student123`. Študent, asistent in profesor pridejo na *Katalog*, tehnik na *Nadzorno ploščo*, administrator na *Uporabnike*.

Po `git pull` z novimi paketi ponovno zgradi slike: `docker compose up -d --build -V`. Če backend po posodobitvi ne pozna nove poti (odgovor »Pot ne obstaja.«), ga ponovno zaženi z `docker compose restart backend` – samodejni ponovni zagon ob spremembah lahko ob hkratni zamenjavi več datotek zgreši zadnjo.

Sistem ustavi z `docker compose down`. Podatki baze ostanejo v volumnu `db-podatki`; izbrišeš jih z `docker compose down -v`.

### Testni računi

> **Samo za razvoj.** Te račune ustvari seed skripta; v produkciji se ne uporabljajo.

| Vloga | E-pošta | Geslo |
|---|---|---|
| Administrator | `admin@rentaj.test` | `admin123` |
| Tehnik | `tehnik@rentaj.test` | `tehnik123` |
| Študent | `student@rentaj.test` | `student123` |
| Asistent | `asistent@rentaj.test` | `asistent123` |
| Profesor | `profesor@rentaj.test` | `profesor123` |

### Backend brez Dockerja

Backend lahko poženeš tudi brez Dockerja (baza naj teče v Compose):

```bash
cd backend
npm install
npm run db:generate
npm run db:seed
npm run dev
```

Frontend na gostitelju (proxy prebere `BACKEND_PORT` iz korenskega `.env`):

```bash
cd frontend
npm install
npm run dev
```

Po dodajanju paketa v Compose ponovno zgradi sliko: `docker compose up -d --build -V frontend` (oziroma `backend`).

## Testi in kakovost kode

Testi tečejo na ločeni bazi `rentaj_test` na istem strežniku PostgreSQL (baza naj teče v Compose). Testi jo ustvarijo sami, uveljavijo migracije in jo pred vsakim testom izpraznijo; razvojne baze se ne dotaknejo.

```bash
cd backend
npm test              # vsi testi enkrat
npm run test:watch    # ponovni zagon ob spremembah
npm run lint          # ESLint
npm run format        # Prettier popravi oblikovanje
```

Frontend ima enake ukaze (`npm test`, `npm run lint`, `npm run format`) v mapi `frontend/`; testi ne potrebujejo baze.

## CI/CD cevovod

Cevovod [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) (GitHub Actions) se zažene ob vsakem pull requestu v `main` in ob vsakem pushu na `main`. Jobi `lint`, `build` in `test` tečejo vzporedno. Vsi trije so obvezne preverbe v zaščiti veje `main`, zato pull requesta s padajočim cevovodom ni mogoče združiti.

| Faza | Kaj naredi |
|---|---|
| **lint** | ESLint in Prettier (`npm run lint`, `npm run format:check`) za backend in frontend. Ob kakršnikoli napaki job pade. |
| **build** | Frontend: `vite build` z naslovom backenda (`VITE_API_URL`) in podpotjo za GitHub Pages; rezultat `dist/` je artefakt `frontend-dist`. Backend: produkcijska Docker slika ([`backend/Dockerfile.prod`](backend/Dockerfile.prod)), shranjena kot artefakt `backend-image`. |
| **test** | Vitest testi backenda (na bazi PostgreSQL v storitvi CI) in frontenda s poročilom o pokritosti kode; poročili sta artefakta `coverage-backend` in `coverage-frontend`. Ob padlem testu pade cevovod. |
| **deploy** | Samo ob pushu na `main` in samo, če so `lint`, `build` in `test` uspeli. Uporabi artefakte iz joba `build` (ne gradi ponovno), teče v okolju `production`. Backend sliko objavi v GitHub Container Registry in jo namesti na [Render](https://render.com) (deploy hook), frontend `dist/` pa na GitHub Pages. |

**Predpomnjenje:** `actions/setup-node` predpomni npm cache (`~/.npm`) glede na `package-lock.json`, sloji Docker slike (vključno z `npm ci`) pa se predpomnijo v GitHub Actions cache.

**Namestitev:** frontend je na GitHub Pages, backend kot Docker vsebnik na Renderju, baza PostgreSQL na [Neonu](https://neon.tech). Backend ob zagonu uveljavi migracije in naloži začetne podatke. Frontend kliče backend na naslovu iz `VITE_API_URL` (spremenljivka repozitorija); backend dovoli zahteve le z izvora `FRONTEND_URL` (CORS) in prijavni piškotek v produkciji pošilja s `SameSite=None; Secure`. Skrivnosti (`DATABASE_URL`, `JWT_SECRET`, deploy hook) so v nastavitvah Renderja oziroma v GitHub Secrets okolja `production`, ne v kodi.

> Ker sta frontend in backend na različnih domenah, je prijavni piškotek piškotek tretje osebe. Brskalniki, ki te blokirajo (npr. Safari), prijave ne omogočijo – uporabi Chrome, Firefox ali Edge.

## Dokumentacija

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md)
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Wireframes](docs/06-wireframes.md)
7. [Oblikovanje](docs/07-oblikovanje.md) in [odločitve o oblikovanju](docs/oblikovanje.md) (tokeni, komponente, dostopnost)
8. [Pregled prevzetega projekta](docs/07-pregled-projekta.md)

Arhitekturne odločitve so zapisane v [docs/adr/](docs/adr/).

## Prevzem projekta

Arhitektura CI/CD je zasnovana na podalagi Render-ja za backend, Neon-ja za podatkovno bazo in GitHub Pages za frontend.

Spletna stran je dostopna [TUAKJ](https://leskovar02.github.io/FORK-rentaj-me/) (https://leskovar02.github.io/FORK-rentaj-me/)

### Padel PR
![Slika padlega PR](docs\img\failed.png)