const path = require('path');
const Database = require('better-sqlite3');
const { expect } = require('chai');

describe('Získávání kvízů a jejich otázek', () => {
  let db;

  before(() => {
    db = new Database(path.join(__dirname, '../db/quiz.sqlite'));
  });

  it('vrací alespoň jeden kvíz', () => {
    const quizzes = db.prepare('SELECT * FROM quizzes').all();
    expect(quizzes.length).to.be.greaterThan(0);
  });

  it('každý kvíz má alespoň jednu otázku', () => {
    const quizzes = db.prepare('SELECT id FROM quizzes').all();

    quizzes.forEach((q) => {
      const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(q.id);
      expect(questions.length).to.be.greaterThan(0);
    });
  });
});
