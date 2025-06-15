const Database = require('better-sqlite3');
const db = new Database('./db/quiz.sqlite');

function getQuizById(id, shuffle = false) {
  // Načteme základní info o kvízu
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
  if (!quiz) throw new Error('Kvíz nenalezen');

  // Načteme všechny otázky pro daný kvíz
  const questions = db
    .prepare(
      `
        SELECT id, text, correct
        FROM questions
        WHERE quiz_id = ?
    `
    )
    .all(id);

  // Ke každé otázce načteme odpovědi
  const choicesStmt = db.prepare(`
        SELECT text FROM choices WHERE question_id = ?
    `);

  const enrichedQuestions = questions.map((q) => {
    const choices = choicesStmt.all(q.id).map((c) => c.text);

    // Zamícháme pořadí otázek i odpovědí
    return {
      text: q.text,
      choices: shuffleArray(choices),
      correct: q.correct,
    };
  });

  return {
    title: quiz.title,
    questions: shuffle ? shuffleArray(enrichedQuestions) : enrichedQuestions,
  };
}

// Fisher-Yates shuffle pro zamíchání pole
function shuffleArray(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = {
  getQuizById,
};
