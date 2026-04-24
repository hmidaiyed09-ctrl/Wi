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
  advanceRoomGameIfReady,
  computeRoomScores,
  submitRoomAnswer,
  subscribeToRoom,
  type RoomPlayer,
  type RoomState,
} from '../services/firebaseRooms';

type Props = {
  roomCode: string;
  localPlayerId: string;
  onLeave: () => void;
};

const formatSeconds = (milliseconds: number): number =>
  Math.max(0, Math.ceil(milliseconds / 1000));

const countAnsweredPlayers = (
  players: RoomPlayer[],
  responses: Record<string, string>,
): number => players.filter(player => typeof responses[player.id] === 'string').length;

export default function FriendQuizScreen({
  roomCode,
  localPlayerId,
  onLeave,
}: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [now, setNow] = useState(Date.now());
  const advanceAttemptRef = useRef('');

  useEffect(() => {
    const unsubscribe = subscribeToRoom(
      roomCode,
      updatedRoom => {
        setRoom(updatedRoom);
        setError('');
      },
      snapshotError => {
        setError(snapshotError.message || 'Live room updates are unavailable.');
      },
    );

    return unsubscribe;
  }, [roomCode]);

  useEffect(() => {
    if (!room?.game || (room.game.phase !== 'answering' && room.game.phase !== 'reveal')) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, [room?.game]);

  const currentQuestion = room?.game?.questions[room.game.currentQuestionIndex] ?? null;
  const currentResponses = currentQuestion
    ? room?.game?.responses[currentQuestion.id] ?? {}
    : {};
  const selectedAnswer =
    (currentQuestion && currentResponses[localPlayerId]) || pendingAnswer;
  const selfPlayer = room?.players.find(player => player.id === localPlayerId) ?? null;

  useEffect(() => {
    if (!room?.game || !currentQuestion) {
      return;
    }

    if (currentResponses[localPlayerId]) {
      setPendingAnswer('');
    }

    const everyoneAnswered =
      room.game.phase === 'answering' &&
      countAnsweredPlayers(room.players, currentResponses) >= room.players.length;
    const phaseExpired =
      (room.game.phase === 'answering' &&
        typeof room.game.questionDeadlineAt === 'number' &&
        now >= room.game.questionDeadlineAt) ||
      (room.game.phase === 'reveal' &&
        typeof room.game.revealEndsAt === 'number' &&
        now >= room.game.revealEndsAt);

    if (!everyoneAnswered && !phaseExpired) {
      advanceAttemptRef.current = '';
      return;
    }

    const advanceKey = [
      room.game.phase,
      room.game.currentQuestionIndex,
      room.game.questionDeadlineAt ?? 'na',
      room.game.revealEndsAt ?? 'na',
      countAnsweredPlayers(room.players, currentResponses),
    ].join(':');

    if (advanceAttemptRef.current === advanceKey) {
      return;
    }

    advanceAttemptRef.current = advanceKey;
    void advanceRoomGameIfReady(roomCode).catch(() => {});
  }, [currentQuestion, currentResponses, localPlayerId, now, room, roomCode]);

  const handleSubmitAnswer = async (option: string) => {
    if (!room?.game || room.game.phase !== 'answering' || !currentQuestion || selectedAnswer) {
      return;
    }

    setIsSubmitting(true);
    setPendingAnswer(option);
    setError('');

    try {
      await submitRoomAnswer(roomCode, localPlayerId, option);
    } catch {
      setPendingAnswer('');
      setError('Unable to submit your answer right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scores = useMemo(() => (room ? computeRoomScores(room) : {}), [room]);

  const sortedPlayers = useMemo(() => {
    if (!room) {
      return [];
    }

    return [...room.players].sort((left, right) => {
      const scoreGap = (scores[right.id] ?? 0) - (scores[left.id] ?? 0);
      if (scoreGap !== 0) {
        return scoreGap;
      }

      return left.joinedAt - right.joinedAt;
    });
  }, [room, scores]);

  if (!room || !room.game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Loading friend room...</Text>
      </View>
    );
  }

  const { game } = room;
  const questionCount = game.questions.length;
  const questionNumber = Math.min(game.currentQuestionIndex + 1, Math.max(questionCount, 1));
  const timerMilliseconds =
    game.phase === 'answering' && typeof game.questionDeadlineAt === 'number'
      ? game.questionDeadlineAt - now
      : 0;
  const revealMilliseconds =
    game.phase === 'reveal' && typeof game.revealEndsAt === 'number'
      ? game.revealEndsAt - now
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onLeave} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Leave match</Text>
      </Pressable>

      <Text style={styles.title}>Friend Match</Text>
      <Text style={styles.subtitle}>
        {room.roomName} · {room.players.length} players
      </Text>

      <View style={styles.playerRibbon}>
        {room.players.map(player => {
          const isSelf = player.id === localPlayerId;
          const playerScore = scores[player.id] ?? 0;

          return (
            <View
              key={player.id}
              style={[
                styles.playerPill,
                isSelf && styles.playerPillSelf,
              ]}
            >
              <View style={[styles.playerPillAvatar, { backgroundColor: player.color }]}>
                <Text style={styles.playerPillAvatarText}>
                  {player.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.playerPillTextWrap}>
                <Text style={styles.playerPillName}>
                  {player.name}
                  {player.isHost ? ' 👑' : ''}
                </Text>
                <Text style={styles.playerPillMeta}>{playerScore} pts</Text>
              </View>
            </View>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {game.phase === 'results' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Final Standings</Text>
          <Text style={styles.cardSubtitle}>
            {questionCount} question{questionCount === 1 ? '' : 's'} completed
          </Text>

          <View style={styles.resultsList}>
            {sortedPlayers.map((player, index) => (
              <View
                key={player.id}
                style={[
                  styles.resultRow,
                  player.id === localPlayerId && styles.resultRowSelf,
                ]}
              >
                <Text style={styles.resultRank}>#{index + 1}</Text>
                <View style={[styles.resultAvatar, { backgroundColor: player.color }]}>
                  <Text style={styles.resultAvatarText}>
                    {player.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {player.name}
                    {player.id === localPlayerId ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {scores[player.id] ?? 0} / {questionCount} correct
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable style={styles.homeButton} onPress={onLeave}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      ) : currentQuestion ? (
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.progressText}>
              Question {questionNumber} / {questionCount}
            </Text>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>
                {game.phase === 'answering' ? `${formatSeconds(timerMilliseconds)}s` : `Reveal ${formatSeconds(revealMilliseconds)}s`}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{currentQuestion.question}</Text>
          {game.phase === 'answering' ? (
            <Text style={styles.cardSubtitle}>
              {countAnsweredPlayers(room.players, currentResponses)} / {room.players.length} answered
            </Text>
          ) : (
            <Text style={styles.cardSubtitle}>
              Answers revealed for everyone
            </Text>
          )}

          <View style={styles.optionList}>
            {currentQuestion.options.map((option, index) => {
              const optionPlayers = room.players.filter(player => currentResponses[player.id] === option);
              const isSelected = selectedAnswer === option;
              const showReveal = game.phase !== 'answering';
              const isCorrect = showReveal && currentQuestion.correctAnswer === option;
              const isWrongSelf = showReveal && isSelected && !isCorrect;

              return (
                <Pressable
                  key={`${currentQuestion.id}-${index}`}
                  disabled={game.phase !== 'answering' || !!selectedAnswer || isSubmitting}
                  onPress={() => handleSubmitAnswer(option)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    isCorrect && styles.optionCardCorrect,
                    isWrongSelf && styles.optionCardWrong,
                  ]}
                >
                  <View style={styles.optionTopRow}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                        isCorrect && styles.optionLabelCorrect,
                        isWrongSelf && styles.optionLabelWrong,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        isCorrect && styles.optionTextCorrect,
                        isWrongSelf && styles.optionTextWrong,
                      ]}
                    >
                      {option}
                    </Text>
                  </View>

                  {showReveal ? (
                    <View style={styles.revealWrap}>
                      <View style={styles.revealBar}>
                        {optionPlayers.length === 0 ? (
                          <View style={styles.revealEmptyBar} />
                        ) : (
                          optionPlayers.map(player => (
                            <View
                              key={`${option}-${player.id}`}
                              style={[
                                styles.revealSegment,
                                { backgroundColor: player.color, flex: 1 },
                              ]}
                            >
                              <Text style={styles.revealSegmentText}>
                                {player.name.slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                      <Text style={styles.revealText}>
                        {optionPlayers.length === 0
                          ? 'No picks'
                          : optionPlayers.map(player => player.name).join(', ')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.optionHint}>
                      {isSelected ? 'Answer locked in' : 'Tap to answer'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Waiting for the next question...</Text>
        </View>
      )}

      {selfPlayer ? (
        <View style={styles.selfCard}>
          <View style={[styles.selfAvatar, { backgroundColor: selfPlayer.color }]}>
            <Text style={styles.selfAvatarText}>
              {selfPlayer.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.selfInfo}>
            <Text style={styles.selfTitle}>You are playing as {selfPlayer.name}</Text>
            <Text style={styles.selfMeta}>
              Color stays visible through the full match so reveals are easy to scan.
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#5F5F5F',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FF8C00',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#171717',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    color: '#777777',
    fontWeight: '600',
  },
  playerRibbon: {
    gap: 10,
    marginBottom: 14,
  },
  playerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 10,
  },
  playerPillSelf: {
    borderColor: '#FFB864',
    backgroundColor: '#FFF8EF',
  },
  playerPillAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPillAvatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  playerPillTextWrap: {
    flex: 1,
  },
  playerPillName: {
    color: '#1F1F1F',
    fontWeight: '800',
  },
  playerPillMeta: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#D23A3A',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressText: {
    color: '#666666',
    fontWeight: '700',
  },
  phaseBadge: {
    backgroundColor: '#FFF1DE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  phaseBadgeText: {
    color: '#D97706',
    fontWeight: '900',
  },
  cardTitle: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 31,
  },
  cardSubtitle: {
    color: '#7B7B7B',
    marginTop: 8,
    fontWeight: '600',
  },
  optionList: {
    marginTop: 18,
    gap: 12,
  },
  optionCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E7E7E7',
    backgroundColor: '#FCFCFC',
    padding: 14,
  },
  optionCardSelected: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5E8',
  },
  optionCardCorrect: {
    borderColor: '#1AA768',
    backgroundColor: '#ECFFF5',
  },
  optionCardWrong: {
    borderColor: '#D94A4A',
    backgroundColor: '#FFF0F0',
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
    color: '#595959',
    fontWeight: '900',
    paddingTop: 4,
  },
  optionLabelSelected: {
    backgroundColor: '#FF8C00',
    color: '#FFFFFF',
  },
  optionLabelCorrect: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
  },
  optionLabelWrong: {
    backgroundColor: '#D94A4A',
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#A95A00',
  },
  optionTextCorrect: {
    color: '#137F50',
  },
  optionTextWrong: {
    color: '#A93434',
  },
  optionHint: {
    marginTop: 10,
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  revealWrap: {
    marginTop: 12,
    gap: 8,
  },
  revealBar: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 24,
  },
  revealEmptyBar: {
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    flex: 1,
  },
  revealSegment: {
    borderRadius: 12,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  revealSegmentText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  revealText: {
    color: '#6B6B6B',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsList: {
    marginTop: 18,
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    padding: 12,
  },
  resultRowSelf: {
    backgroundColor: '#FFF4E5',
  },
  resultRank: {
    width: 28,
    color: '#666666',
    fontWeight: '900',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#1A1A1A',
    fontWeight: '800',
  },
  resultMeta: {
    color: '#777777',
    fontWeight: '600',
    marginTop: 2,
  },
  homeButton: {
    marginTop: 18,
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  selfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 14,
  },
  selfAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  selfInfo: {
    flex: 1,
  },
  selfTitle: {
    color: '#1A1A1A',
    fontWeight: '800',
  },
  selfMeta: {
    marginTop: 4,
    color: '#7A7A7A',
    fontWeight: '600',
    lineHeight: 18,
  },
});
