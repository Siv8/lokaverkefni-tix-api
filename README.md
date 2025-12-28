Lokaverkefni - Tix API

REST API fyrir viðburðakerfi (eins og Tix) þar sem notendur geta skoðað viðburði, keypt miða, séð bókanir sínar og stjórnað notendaprófíl.  
Verkefnið er byggt með **Node.js, TypeScript, Express og PostgreSQL** og inniheldur umfangsmiklar sjálfvirkar prófanir.

---

## Tækni
- Node.js
- TypeScript
- Express
- PostgreSQL
- JWT (auðkenning)
- bcrypt (lykilorð)
- Vitest + Supertest (prófanir)

---

## Uppsetning

### 1. Sækja dependencies

npm install
### 2. Umhverfisbreytur
Búðu til .env skrá (sjá .env.example):
- PGHOST=localhost
- PGPORT=5432
- PGDATABASE=tix
- PGUSER=postgres
- PGPASSWORD=yourpassword
- JWT_SECRET=supersecret

### 3. Keyra API
npm run dev

API keyrir sjálfgefið á:
http://localhost:3000

## Gagnagrunnur (SQL)
### SQL skema
- SQL skema er skilgreint í:
- sql/schema.sql
### Skemaið inniheldur:
- users
- events
- venues
- categories
- tickets
- bookings
- booking_tickets
- tengingar, constraints og indexes
- Skemaið skal keyra í PostgreSQL (pgAdmin eða psql) áður en API er keyrt.

## Test gagnagrunnur & seed
```
Seed gögn eru eingöngu notuð í testum, ekki í production keyrslu.
Tests nota sérstakan test-database (.env.test)
Fyrir hvert test run:
Töflur eru hreinsaðar
Skema er notað
Seed gögn eru sett inn programmatically í tests/setup.ts
Seed í testum inniheldur:
venues
categories
events (framtíð, <24 klst, liðnir)
tickets
Þetta tryggir:
endurtekningarhæf tests
isolation milli tests
engin dependency á static seed skrár
```

## Keyra prófanir
npm test
- ✅ Allar prófanir standast (39/39).

## API Endapunktar & UC Coverage

## UC1 – Skoða viðburði
- GET /events
- Síur: city, categoryId, from, to
- Röðun: sort=date|price, order=asc|desc
- Engar niðurstöður → 200 með { items: [] }

## UC2 – Skoða upplýsingar um viðburð
- GET /events/:id
- Skilar viðburði + miðum
- 404 ef viðburður finnst ekki
- 400 ef id er ógilt

## UC3 – Skoða upplýsingar um stað
- GET /venues/:id
- Skilar stað + væntanlegum viðburðum

## UC4 – Skrá notanda
- POST /auth/register
- UC5 – Innskráning
- POST /auth/login
- Skilar JWT token

## UC6 – Kaupa miða
- POST /bookings (krefst auth)
- Staðfestir framboð
- Kemur í veg fyrir oversell (transactions + locking)
- Hafnar bókun á liðna viðburði

## UC7 – Skoða bókunarsögu
- GET /bookings (krefst auth)
- Tóm saga → { items: [] }

## UC8 – Hætta við bókun
- DELETE /bookings/:id (krefst auth)
- Aðeins leyfilegt >24 klst fyrir viðburð
- Miðar fara aftur í tiltækan hóp
- 404 ef bókun finnst ekki
- 403 ef bókun tilheyrir öðrum notanda
- 409 ef reynt er að afpanta tvisvar

## UC9 – Uppfæra prófíl
- PUT /users/me (krefst auth)
- Uppfærir nafn, netfang og/eða lykilorð
- 409 ef netfang er þegar í notkun

## UC10 – Eyða reikningi
- DELETE /users/me (krefst auth)
- Hættir við allar framtíðarbókanir (>24 klst)
- Skilar miðum aftur
- Eyðir notanda


## Prófanir (Test coverage)
- Sjálfvirkar prófanir með Vitest + Supertest:
- UC1: eventsFilters, eventsSort, eventsEmpty
- UC2: eventById
- UC3: venueById
- UC4: authRegister
- UC5: authLogin
- UC6: bookingsCreate, bookingsPastEvent
- UC7: bookingsList, bookingsEmpty
- UC8: bookingsCancel (404, 403, <24h, >24h, double cancel)
- UC9: usersUpdate
- UC10: usersDelete
- Auth middleware: requireAuth



##  Öryggi & gagnastaðfesting
- Lykilorð eru hössuð með bcrypt
- JWT notað fyrir auðkenningu
- Allar verndaðar aðgerðir krefjast auth
- Gögn frá notanda eru staðfest
- Viðeigandi HTTP status codes og villuskilaboð