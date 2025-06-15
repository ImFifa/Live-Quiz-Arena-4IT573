# Live Quiz Arena

Jednoduchá real-time kvízová hra v Node.js s použitím Socket.IO, SQLite a EJS.

## Spuštění

```bash
npm install
node app.js
```

Otevři http://localhost:3000

## Docker

```bash
docker build -t quiz-arena .
docker run -p 3000:3000 quiz-arena
```

## Testy

```bash
npm install --save-dev mocha chai
npx mocha tests/*.js
```
