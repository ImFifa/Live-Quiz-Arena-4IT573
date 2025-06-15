const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { expect } = require('chai');

describe('Databáze – základní integrita', () => {
  let db;

  before(() => {
    db = new Database(path.join(__dirname, '../db/quiz.sqlite'));
  });

  it('obsahuje tabulku quizzes', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quizzes'");
    const result = stmt.get();
    expect(result).to.be.an('object');
    expect(result.name).to.equal('quizzes');
  });

  it('obsahuje tabulku questions', () => {
    const stmt = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='questions'"
    );
    const result = stmt.get();
    expect(result).to.be.an('object');
    expect(result.name).to.equal('questions');
  });

  it('obsahuje tabulku choices', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='choices'");
    const result = stmt.get();
    expect(result).to.be.an('object');
    expect(result.name).to.equal('choices');
  });
});
