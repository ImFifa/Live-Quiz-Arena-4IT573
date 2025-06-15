const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('./db/quiz.sqlite');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const quizFiles = fs.readdirSync(path.join(__dirname, '../quizzes'));
const getQuizByTitle = db.prepare('SELECT id FROM quizzes WHERE title = ?');
const insertQuiz = db.prepare('INSERT INTO quizzes (title) VALUES (?)');
const insertQuestion = db.prepare(
  'INSERT INTO questions (quiz_id, text, correct) VALUES (?, ?, ?)'
);
const insertChoice = db.prepare('INSERT INTO choices (question_id, text) VALUES (?, ?)');

for (const file of quizFiles) {
  const fullPath = path.join(__dirname, '../quizzes', file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  // Skip if quiz already exists
  const existingQuiz = getQuizByTitle.get(data.title);
  if (existingQuiz) {
    console.log(`⚠️  Quiz "${data.title}" už existuje – přeskočeno.`);
    continue;
  }

  const { lastInsertRowid: quizId } = insertQuiz.run(data.title);

  for (const q of data.questions) {
    const { lastInsertRowid: questionId } = insertQuestion.run(quizId, q.text, q.correct);
    for (const choice of q.choices) {
      insertChoice.run(questionId, choice);
    }
  }

  console.log(`✅ Quiz "${data.title}" úspěšně vložen.`);
}

console.log('🎉 Seeding complete!');
