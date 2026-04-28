import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  advanceQuestion,
  leaveRoom,
  submitAnswer,
  subscribeToRoom,
  type RoomState,
} from '../services/firebaseRooms';

type Props = {
  roomCode: string;
  localPlayerId: string;
  onLeave: () => void;
};

export default function FriendQuizScreen({
  roomCode,
  localPlayerId,
  onLeave,
}: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [hostLeft, setHostLeft] = useState(false);
  const [preQuestionCountdown, setPreQuestionCountdown] = useState<number | null>(
    null,
  );
  const latestRoomStatusRef = useRef<RoomState['status'] | null>(null);
  const hasShownCountdownRef = useRef(false);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const unsubscribe = subscribeToRoom(
      roomCode,
      updatedRoom => {
        latestRoomStatusRef.current = updatedRoom.status;
        setRoom(updatedRoom);
        setHostLeft(false);
        setError('');
      },
      err => {
        const lastStatus = latestRoomStatusRef.current;
        if (
          err.message === 'ROOM_NOT_FOUND' &&
          (lastStatus === 'waiting' || lastStatus === 'in_game')
        ) {
          setHostLeft(true);
          setError('');
          return;
        }
        setError(err.message || 'Connection lost');
      },
    );

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Tick every 250ms while a question is active so the timer updates.
  useEffect(() => {
    if (!room || room.status !== 'in_game') {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [room]);

  useEffect(() => {
    if (!room || room.status !== 'in_game' || room.currentQuestionIndex !== 0) {
      return;
    }
    if (hasShownCountdownRef.current) {
      return;
    }

    hasShownCountdownRef.current = true;
    setPreQuestionCountdown(3);
    let seconds = 3;
    const interval = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        setPreQuestionCountdown(null);
        clearInterval(interval);
      } else {
        setPreQuestionCountdown(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  const currentQuestionIndex = room?.currentQuestionIndex ?? 0;
  const currentQuestion = room?.questions?.[currentQuestionIndex];
  const isHost = room?.hostId === localPlayerId;
  const isCountdownActive =
    preQuestionCountdown !== null &&
    room?.status === 'in_game' &&
    currentQuestionIndex === 0;

  const myAnswer = useMemo(() => {
    if (!room) return undefined;
    const playerAnswers = room.answers?.[localPlayerId];
    if (!playerAnswers) return undefined;
    return playerAnswers[String(currentQuestionIndex)];
  }, [room, localPlayerId, currentQuestionIndex]);

  const timeLimit = currentQuestion?.timeLimitSeconds ?? 25;
  const startedAtMs = room?.questionStartedAt
    ? Date.parse(room.questionStartedAt)
    : 0;
  const elapsedMs = Math.max(0, now - startedAtMs);
  const remainingSec = Math.max(
    0,
    Math.ceil(timeLimit - elapsedMs / 1000),
  );
  const isTimeUp = remainingSec === 0 && startedAtMs > 0;

  const playersById = useMemo(() => {
    const map: Record<string, string> = {};
    room?.players.forEach(p => {
      map[p.id] = p.name;
    });
    return map;
  }, [room]);

  const allAnswered = useMemo(() => {
    if (!room) return false;
    const answers = room.answers ?? {};
    return room.players.every(
      p => answers[p.id]?.[String(currentQuestionIndex)] !== undefined,
    );
  }, [room, currentQuestionIndex]);

  const handleLeave = async () => {
    try {
      if (roomCode && localPlayerId) {
        await leaveRoom(roomCode, localPlayerId);
      }
    } catch {
      // Best-effort cleanup; user is leaving anyway.
    }
    onLeave();
  };

  const handlePickAnswer = async (option: string) => {
    if (!room || !currentQuestion) return;
    if (myAnswer !== undefined || submittingAnswer) return;
    setSubmittingAnswer(true);
    setSubmitError('');
    try {
      await submitAnswer(
        roomCode,
        localPlayerId,
        currentQuestionIndex,
        option,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(`Could not send your answer: ${message}`);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAdvance = async () => {
    if (!isHost || advancing) return;
    setAdvancing(true);
    try {
      await advanceQuestion(roomCode, localPlayerId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(`Could not advance: ${message}`);
    } finally {
      setAdvancing(false);
    }
  };

  if (hostLeft) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Host left the lobby</Text>
        <Text style={styles.statusText}>
          This room is no longer available. Please go back and join another room.
        </Text>
        <Pressable onPress={onLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Room Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={onLeave} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </Pressable>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Connecting to room {roomCode}…</Text>
      </View>
    );
  }

  // ===================== FINISHED — Final leaderboard =====================
  if (room.status === 'finished') {
    const leaderboard = [...room.players]
      .map(p => ({
        id: p.id,
        name: p.name,
        score: room.scores?.[p.id] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
    const totalQuestions = room.questions.length;
    const winner = leaderboard[0];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>🏆 Game Over</Text>
          {winner ? (
            <Text style={styles.winnerText}>
              Winner: {winner.name} ({winner.score}/{totalQuestions})
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Final Leaderboard</Text>
          {leaderboard.map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.leaderRow,
                index === 0 && styles.leaderRowFirst,
                entry.id === localPlayerId && styles.leaderRowYou,
              ]}
            >
              <Text style={styles.leaderRank}>#{index + 1}</Text>
              <Text style={styles.leaderName}>
                {entry.name}
                {entry.id === localPlayerId ? ' (you)' : ''}
              </Text>
              <Text style={styles.leaderScore}>
                {entry.score}/{totalQuestions}
              </Text>
            </View>
          ))}

          <Pressable onPress={handleLeave} style={styles.leaveButton}>
            <Text style={styles.leaveButtonText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ===================== WAITING — Pre-game lobby =====================
  if (room.status === 'waiting') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Room: {room.roomName}</Text>
          <Text style={styles.codeText}>Code: {room.code}</Text>
          <Text style={styles.statusText}>Status: Waiting</Text>

          <Text style={styles.sectionTitle}>
            Players ({room.players.length})
          </Text>
          {room.players.map(player => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={styles.playerName}>
                {player.name}
                {player.isHost ? ' (Host)' : ''}
                {player.id === localPlayerId ? ' (You)' : ''}
              </Text>
            </View>
          ))}

          <Text style={styles.waitingText}>
            Waiting for the host to start the game…
          </Text>

          <Pressable onPress={handleLeave} style={styles.leaveButton}>
            <Text style={styles.leaveButtonText}>Leave Room</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ===================== IN GAME =====================
  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Preparing question…</Text>
      </View>
    );
  }

  const totalQuestions = room.questions.length;
  const correctAnswer = currentQuestion.correctAnswer;
  const answersForThisQuestion = room.answers ?? {};
  const answeredCount = room.players.filter(
    p => answersForThisQuestion[p.id]?.[String(currentQuestionIndex)] !== undefined,
  ).length;

  const showCorrectness = myAnswer !== undefined || isTimeUp;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>
            Question {currentQuestionIndex + 1} / {totalQuestions}
          </Text>
          <View
            style={[
              styles.timerBadge,
              remainingSec <= 5 && styles.timerBadgeCritical,
            ]}
          >
            <Text
              style={[
                styles.timerText,
                remainingSec <= 5 && styles.timerTextCritical,
              ]}
            >
              {remainingSec}s
            </Text>
          </View>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, index) => {
            const isMyChoice = myAnswer === option;
            const isCorrectOption = option === correctAnswer;
            const showAsCorrect = showCorrectness && isCorrectOption;
            const showAsWrong =
              showCorrectness && isMyChoice && !isCorrectOption;
            const disabled =
              myAnswer !== undefined ||
              submittingAnswer ||
              isTimeUp ||
              isCountdownActive;

            return (
              <Pressable
                key={option + index}
                onPress={() => handlePickAnswer(option)}
                disabled={disabled}
                style={[
                  styles.optionBox,
                  isMyChoice && styles.optionBoxSelected,
                  showAsCorrect && styles.optionBoxCorrect,
                  showAsWrong && styles.optionBoxWrong,
                ]}
              >
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    isMyChoice && styles.optionTextSelected,
                    showAsCorrect && styles.optionTextCorrect,
                    showAsWrong && styles.optionTextWrong,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {submitError ? (
          <Text style={styles.errorText}>{submitError}</Text>
        ) : null}

        <Text style={styles.answeredCounter}>
          {answeredCount}/{room.players.length} players answered
        </Text>

        {isHost ? (
          <Pressable
            onPress={handleAdvance}
            disabled={advancing || (!allAnswered && !isTimeUp) || isCountdownActive}
            style={[
              styles.advanceButton,
              (advancing || (!allAnswered && !isTimeUp) || isCountdownActive) &&
                styles.advanceButtonDisabled,
            ]}
          >
            {advancing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.advanceButtonText}>
                {currentQuestionIndex + 1 >= totalQuestions
                  ? 'Finish Game'
                  : 'Next Question'}
              </Text>
            )}
          </Pressable>
        ) : myAnswer !== undefined ? (
          <Text style={styles.waitingHostText}>
            Waiting for the host to advance…
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Live Scores</Text>
        {[...room.players]
          .sort(
            (a, b) =>
              (room.scores?.[b.id] ?? 0) - (room.scores?.[a.id] ?? 0),
          )
          .map(p => (
            <View
              key={p.id}
              style={[
                styles.leaderRow,
                p.id === localPlayerId && styles.leaderRowYou,
              ]}
            >
              <Text style={styles.leaderName}>
                {playersById[p.id] ?? p.name}
                {p.id === localPlayerId ? ' (you)' : ''}
                {p.isHost ? ' 👑' : ''}
              </Text>
              <Text style={styles.leaderScore}>
                {room.scores?.[p.id] ?? 0}
              </Text>
            </View>
          ))}

        <Pressable onPress={handleLeave} style={styles.leaveButtonSmall}>
          <Text style={styles.leaveButtonText}>Leave Game</Text>
        </Pressable>
      </ScrollView>
      {isCountdownActive ? (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownLabel}>Get Ready</Text>
          <Text style={styles.countdownValue}>{preQuestionCountdown}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    padding: 16,
  },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeText: {
    fontSize: 18,
    color: '#FF8C00',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#8B8FAD',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLabel: {
    color: '#8B8FAD',
    fontSize: 14,
    fontWeight: '700',
  },
  timerBadge: {
    backgroundColor: '#FFF2DE',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#D6B88D',
  },
  timerBadgeCritical: {
    backgroundColor: '#FCE1E1',
    borderColor: '#D93B3B',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B4A1F',
  },
  timerTextCritical: {
    color: '#D93B3B',
  },
  questionCard: {
    backgroundColor: '#2A2D3E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  optionsList: {
    gap: 10,
    marginBottom: 14,
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8D8BE',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 56,
  },
  optionBoxSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  optionBoxCorrect: {
    backgroundColor: '#DFF7E2',
    borderColor: '#2E9B4F',
  },
  optionBoxWrong: {
    backgroundColor: '#FCE1E1',
    borderColor: '#D93B3B',
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1E2CB',
    color: '#6F4A16',
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    marginRight: 12,
    paddingTop: 5,
  },
  optionText: {
    flex: 1,
    color: '#43362A',
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: { color: '#FFFFFF' },
  optionTextCorrect: { color: '#1A6A34' },
  optionTextWrong: { color: '#9E1E1E' },
  answeredCounter: {
    color: '#8B8FAD',
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 8,
  },
  advanceButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  advanceButtonDisabled: {
    backgroundColor: '#555866',
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  waitingHostText: {
    color: '#8B8FAD',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    marginBottom: 10,
  },
  playerRow: {
    backgroundColor: '#2A2D3E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D3E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    gap: 10,
  },
  leaderRowFirst: {
    borderWidth: 2,
    borderColor: '#FFD25F',
  },
  leaderRowYou: {
    borderWidth: 1.5,
    borderColor: '#FF8C00',
  },
  leaderRank: {
    color: '#FF8C00',
    fontWeight: '900',
    width: 32,
  },
  leaderName: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  leaderScore: {
    color: '#FFD25F',
    fontWeight: '900',
  },
  winnerText: {
    color: '#FFD25F',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  waitingText: {
    marginTop: 24,
    fontSize: 15,
    color: '#8B8FAD',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B8FAD',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 12,
  },
  leaveButton: {
    marginTop: 32,
    backgroundColor: '#E74C3C',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignSelf: 'center',
  },
  leaveButtonSmall: {
    marginTop: 24,
    backgroundColor: '#3B3E50',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 29, 42, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownLabel: {
    color: '#D0D4F5',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  countdownValue: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 78,
  },
});
