const path = require('path');
const Database = require('better-sqlite3');
const { expect } = require('chai');

describe('Správnost odpovědí a variant', () => {
  let db;

  before(() => {
    db = new Database(path.join(__dirname, '../db/quiz.sqlite'));
  });

  it('každá otázka má aspoň 2 možnosti', () => {
    const questions = db.prepare('SELECT id FROM questions').all();

    questions.forEach((q) => {
      const choices = db.prepare('SELECT * FROM choices WHERE question_id = ?').all(q.id);
      expect(choices.length).to.be.at.least(2);
    });
  });

  it('každá otázka má pole "correct" se shodou v možnostech', () => {
    const questions = db.prepare('SELECT id, correct FROM questions').all();

    questions.forEach((q) => {
      const choices = db.prepare('SELECT text FROM choices WHERE question_id = ?').all(q.id);
      const texts = choices.map((c) => c.text);
      expect(texts).to.include(q.correct);
    });
  });
});
