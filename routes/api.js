const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const router = express.Router();

const db = new Database(path.join(__dirname, '..', './db/quiz.sqlite'));

// GET /api/quizzes
router.get('/quizzes', (req, res) => {
  try {
    const quizzes = db.prepare('SELECT id, title FROM quizzes').all();
    res.json(quizzes);
  } catch (err) {
    console.error('Chyba při načítání kvízů z DB:', err);
    res.status(500).json({ error: 'Nepodařilo se načíst kvízy.' });
  }
});

module.exports = router;
