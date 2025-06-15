const { getQuizById } = require('./db/quizService');

module.exports = function (io) {
  const rooms = new Map(); // roomId => { hostId, quiz, currentIndex, players, status }

  io.on('connection', (socket) => {
    console.log('Nové připojení:', socket.id);

    // Host zakládá místnost
    socket.on('host-quiz', ({ quizId, roomId, shuffleQuestions }) => {
      try {
        const quiz = getQuizById(quizId, shuffleQuestions);
        rooms.set(roomId, {
          hostId: socket.id,
          quiz,
          currentIndex: -1,
          players: [],
          status: 'waiting',
        });

        socket.join(roomId);
        socket.roomId = roomId;
        socket.role = 'host';

        socket.emit('quiz-ready', {
          title: quiz.title,
          questionCount: quiz.questions.length,
          roomId: roomId,
        });

        console.log(`Host ${socket.id} založil místnost ${roomId}`);
      } catch (err) {
        socket.emit('error', err.message);
      }
    });

    // Hráč se připojuje
    socket.on('player-join', ({ nickname, roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Místnost nenalezena');
        return;
      }

      if (room.players.length > 0 && room.players.some((p) => p.nickname === nickname)) {
        socket.emit('error', 'Toto jméno již používá jiný hráč');
        return;
      }

      // Add player with initial values
      room.players.push({
        id: socket.id,
        nickname,
        score: 0,
        lastAnswer: null,
        hasAnswered: false,
      });

      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.role = 'player';

      socket.emit('joined', {
        roomId,
        quizTitle: room.quiz.title,
        questionCount: room.quiz.questions.length,
        status: room.status,
      });

      // Immediately update all players with current state
      updatePlayers(roomId);
    });

    // Host spouští kvíz
    socket.on('start-quiz', () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || socket.role !== 'host') return;

      room.status = 'in-progress';
      room.currentIndex = 0;

      sendCountdown(roomId, 'start');
      setTimeout(() => sendQuestion(roomId), 3000);
    });

    // Další otázka
    socket.on('next-question', () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || socket.role !== 'host') return;

      room.currentIndex++;
      if (room.currentIndex >= room.quiz.questions.length) {
        endQuiz(roomId);
        return;
      }

      sendCountdown(roomId, 'next');
      setTimeout(() => sendQuestion(roomId), 3000);
      io.to(roomId).emit('next-question-pending');
    });

    socket.on('end-quiz', () => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || socket.role !== 'host') return;

      endQuiz(roomId);
    });

    // Odpověď hráče
    socket.on('answer', ({ answer }) => {
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'in-progress') return;

      const q = room.quiz.questions[room.currentIndex];
      const correct = answer === q.correct;

      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.score += correct ? 1 : 0;
        player.lastAnswer = correct ? 'correct' : 'wrong';
        player.hasAnswered = true;
      }

      socket.emit('answer-result', { correct });
      updatePlayers(roomId);
    });

    // Pomocné funkce
    function sendQuestion(roomId) {
      const room = rooms.get(roomId);
      if (!room || room.currentIndex < 0) return;

      const q = room.quiz.questions[room.currentIndex];

      // Reset answer states
      room.players.forEach((p) => {
        p.hasAnswered = false;
        p.lastAnswer = null;
      });

      io.to(roomId).emit('new-question', {
        text: q.text, // Make sure this property exists
        choices: q.choices || [], // Ensure choices exist
        current: room.currentIndex + 1,
        total: room.quiz.questions.length,
      });

      updatePlayers(roomId);
    }

    function endQuiz(roomId) {
      const room = rooms.get(roomId);
      room.status = 'finished';

      const results = room.players.map((p) => ({
        nickname: p.nickname,
        score: p.score,
        total: room.quiz.questions.length,
      }));

      io.to(roomId).emit('quiz-finished', { results });
      rooms.delete(roomId);
    }

    function updatePlayers(roomId) {
      const room = rooms.get(roomId);
      if (!room) return;

      io.to(roomId).emit('players-updated', {
        players: room.players.map((p) => ({
          nickname: p.nickname,
          score: p.score,
          lastAnswer: p.lastAnswer,
          hasAnswered: p.hasAnswered,
        })),
        quizTitle: room.quiz.title,
        totalQuestions: room.quiz.questions.length,
        currentQuestion: room.currentIndex + 1,
        status: room.status,
      });
    }

    function sendCountdown(roomId, type = 'next') {
      io.to(roomId).emit('countdown-start', {
        type,
        duration: 3,
        message: type === 'start' ? 'Kvíz začne za' : 'Další otázka za',
      });
    }

    // Odpojení
    socket.on('disconnect', () => {
      const roomId = socket.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      if (socket.role === 'host') {
        io.to(roomId).emit('host-disconnected');
        rooms.delete(roomId);
      } else {
        room.players = room.players.filter((p) => p.id !== socket.id);
        updatePlayers(roomId);
      }
    });
  });
};
