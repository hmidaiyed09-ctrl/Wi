import { firebase, realtimeDb } from './firebaseClient';

const ROOM_CODE_LENGTH = 6;
const MAX_CREATE_ATTEMPTS = 8;
const REVEAL_DURATION_MS = 2000;

export const MAX_ROOM_PLAYERS = 5;
export const PLAYER_COLOR_PALETTE = [
  '#FF8C00',
  '#2563EB',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
] as const;

type RoomStatus = 'waiting' | 'in_game' | 'completed';
export type FriendGamePhase = 'lobby' | 'answering' | 'reveal' | 'results';

export type RoomPlayer = {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
  color: string;
  authUid?: string;
};

export type FriendQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  timeLimitSeconds: number;
};

export type RoomGameState = {
  phase: FriendGamePhase;
  questions: FriendQuizQuestion[];
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionDeadlineAt: number | null;
  revealEndsAt: number | null;
  responses: Record<string, Record<string, string>>;
  startedAt: number | null;
  completedAt: number | null;
};

export type RoomState = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  maxPlayers: number;
  players: RoomPlayer[];
  game: RoomGameState | null;
};

export type RoomJoinResult = RoomState & {
  localPlayerId: string;
};

type RoomPlayerRecord = Record<string, RoomPlayer>;

type RoomDocument = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  maxPlayers: number;
  players: RoomPlayerRecord;
  game: RoomGameState | null;
  createdAt: unknown;
  updatedAt: unknown;
};

type StartRoomGameInput = {
  questions: FriendQuizQuestion[];
};

const sanitizeRoomCode = (input: string): string =>
  input.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH);

const createPlayerId = (): string =>
  `player_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const generateCandidateCode = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const toTimestamp = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const sortPlayers = (players: RoomPlayer[]): RoomPlayer[] =>
  [...players].sort((left, right) => {
    if (left.isHost !== right.isHost) {
      return left.isHost ? -1 : 1;
    }

    return left.joinedAt - right.joinedAt;
  });

const normalizePlayer = (playerId: string, raw: unknown): RoomPlayer | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const name =
    typeof raw.name === 'string' && raw.name.trim().length > 0
      ? raw.name.trim()
      : 'Guest';
  const joinedAt = toTimestamp(raw.joinedAt) ?? Date.now();
  const color =
    typeof raw.color === 'string' && raw.color.trim().length > 0
      ? raw.color
      : PLAYER_COLOR_PALETTE[0];

  return {
    id: playerId,
    name,
    joinedAt,
    isHost: raw.isHost === true,
    color,
    authUid:
      typeof raw.authUid === 'string' && raw.authUid.trim().length > 0
        ? raw.authUid
        : undefined,
  };
};

const normalizePlayers = (raw: unknown): RoomPlayer[] => {
  if (!isRecord(raw)) {
    return [];
  }

  const players = Object.entries(raw)
    .map(([playerId, value]) => normalizePlayer(playerId, value))
    .filter((player): player is RoomPlayer => player !== null);

  return sortPlayers(players);
};

const normalizeQuestions = (raw: unknown): FriendQuizQuestion[] => {
  const source = Array.isArray(raw)
    ? raw
    : isRecord(raw)
    ? Object.entries(raw)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([, value]) => value)
    : [];

  return source
    .map((entry, index) => {
      if (!isRecord(entry) || typeof entry.question !== 'string') {
        return null;
      }

      const options = Array.isArray(entry.options)
        ? entry.options
            .map(option => String(option).trim())
            .filter(option => option.length > 0)
            .slice(0, 4)
        : [];

      if (options.length === 0) {
        return null;
      }

      const correctAnswer =
        typeof entry.correctAnswer === 'string' && options.includes(entry.correctAnswer)
          ? entry.correctAnswer
          : options[0];

      return {
        id:
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id
            : `${index + 1}`,
        question: entry.question.trim(),
        options,
        correctAnswer,
        timeLimitSeconds:
          typeof entry.timeLimitSeconds === 'number' && entry.timeLimitSeconds > 0
            ? entry.timeLimitSeconds
            : 20,
      };
    })
    .filter((question): question is FriendQuizQuestion => question !== null);
};

const normalizeResponses = (raw: unknown): Record<string, Record<string, string>> => {
  if (!isRecord(raw)) {
    return {};
  }

  return Object.entries(raw).reduce<Record<string, Record<string, string>>>(
    (accumulator, [questionId, value]) => {
      if (!isRecord(value)) {
        return accumulator;
      }

      const responses = Object.entries(value).reduce<Record<string, string>>(
        (answerAccumulator, [playerId, answer]) => {
          if (typeof answer === 'string' && answer.trim().length > 0) {
            answerAccumulator[playerId] = answer;
          }

          return answerAccumulator;
        },
        {},
      );

      accumulator[questionId] = responses;
      return accumulator;
    },
    {},
  );
};

const normalizeGame = (raw: unknown): RoomGameState | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const questions = normalizeQuestions(raw.questions);
  if (questions.length === 0 && raw.phase !== 'lobby') {
    return null;
  }

  return {
    phase:
      raw.phase === 'answering' ||
      raw.phase === 'reveal' ||
      raw.phase === 'results'
        ? raw.phase
        : 'lobby',
    questions,
    currentQuestionIndex:
      typeof raw.currentQuestionIndex === 'number' && raw.currentQuestionIndex >= 0
        ? raw.currentQuestionIndex
        : 0,
    questionStartedAt: toTimestamp(raw.questionStartedAt),
    questionDeadlineAt: toTimestamp(raw.questionDeadlineAt),
    revealEndsAt: toTimestamp(raw.revealEndsAt),
    responses: normalizeResponses(raw.responses),
    startedAt: toTimestamp(raw.startedAt),
    completedAt: toTimestamp(raw.completedAt),
  };
};

const parseRoomState = (raw: unknown, fallbackCode: string): RoomState => {
  const roomObject = isRecord(raw) ? raw : {};
  const players = normalizePlayers(roomObject.players);

  return {
    code: typeof roomObject.code === 'string' ? roomObject.code : fallbackCode,
    roomName:
      typeof roomObject.roomName === 'string' && roomObject.roomName.trim().length > 0
        ? roomObject.roomName.trim()
        : 'myfriend',
    status:
      roomObject.status === 'in_game' || roomObject.status === 'completed'
        ? roomObject.status
        : 'waiting',
    hostId: typeof roomObject.hostId === 'string' ? roomObject.hostId : '',
    maxPlayers:
      typeof roomObject.maxPlayers === 'number' && roomObject.maxPlayers > 0
        ? roomObject.maxPlayers
        : MAX_ROOM_PLAYERS,
    players,
    game: normalizeGame(roomObject.game),
  };
};

const getAvailableColor = (players: RoomPlayer[]): string => {
  const usedColors = new Set(players.map(player => player.color));
  return (
    PLAYER_COLOR_PALETTE.find(color => !usedColors.has(color)) ??
    PLAYER_COLOR_PALETTE[players.length % PLAYER_COLOR_PALETTE.length]
  );
};

const getEstimatedServerTime = async (): Promise<number> => {
  try {
    const offsetSnapshot = await realtimeDb.ref('.info/serverTimeOffset').once('value');
    const offset = offsetSnapshot.val();
    return Date.now() + (typeof offset === 'number' ? offset : 0);
  } catch {
    return Date.now();
  }
};

const roomRefForCode = (roomCodeInput: string) =>
  realtimeDb.ref(`rooms/${sanitizeRoomCode(roomCodeInput)}`);

export const createRoom = async (
  hostName: string,
  roomName = 'myfriend',
  authUid = '',
): Promise<RoomJoinResult> => {
  const trimmedHostName = hostName.trim() || 'Host';
  const trimmedRoomName = roomName.trim() || 'myfriend';
  const joinedAt = await getEstimatedServerTime();

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = generateCandidateCode();
    const hostId = createPlayerId();

    const roomPayload: RoomDocument = {
      code,
      roomName: trimmedRoomName,
      status: 'waiting',
      hostId,
      maxPlayers: MAX_ROOM_PLAYERS,
      players: {
        [hostId]: {
          id: hostId,
          name: trimmedHostName,
          joinedAt,
          isHost: true,
          color: PLAYER_COLOR_PALETTE[0],
          ...(authUid ? { authUid } : {}),
        },
      },
      game: {
        phase: 'lobby',
        questions: [],
        currentQuestionIndex: 0,
        questionStartedAt: null,
        questionDeadlineAt: null,
        revealEndsAt: null,
        responses: {},
        startedAt: null,
        completedAt: null,
      },
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
    };

    const creationResult = await realtimeDb
      .ref(`rooms/${code}`)
      .transaction(current => (current === null ? roomPayload : undefined), undefined, false);

    if (creationResult.committed) {
      return {
        ...parseRoomState(creationResult.snapshot.val(), code),
        localPlayerId: hostId,
      };
    }
  }

  throw new Error('ROOM_CODE_GENERATION_FAILED');
};

export const joinRoom = async (
  roomCodeInput: string,
  playerName: string,
  authUid = '',
): Promise<RoomJoinResult> => {
  const code = sanitizeRoomCode(roomCodeInput);

  if (code.length !== ROOM_CODE_LENGTH) {
    throw new Error('INVALID_ROOM_CODE');
  }

  const roomRef = roomRefForCode(code);
  const joinedAt = await getEstimatedServerTime();
  const trimmedName = playerName.trim() || 'Guest';
  let localPlayerId = '';
  let abortReason = 'JOIN_ROOM_FAILED';

  const joinResult = await roomRef.transaction(current => {
    if (!isRecord(current)) {
      abortReason = 'ROOM_NOT_FOUND';
      return undefined;
    }

    const existingRoom = parseRoomState(current, code);
    const existingPlayers = existingRoom.players;

    if (existingRoom.status !== 'waiting' || existingRoom.game?.phase !== 'lobby') {
      abortReason = 'ROOM_ALREADY_STARTED';
      return undefined;
    }

    if (authUid) {
      const returningPlayer = existingPlayers.find(player => player.authUid === authUid);
      if (returningPlayer) {
        localPlayerId = returningPlayer.id;
        const rawPlayers = isRecord(current.players) ? current.players : {};
        const existingPlayerRecord: Record<string, unknown> = isRecord(rawPlayers[returningPlayer.id])
          ? rawPlayers[returningPlayer.id] as Record<string, unknown>
          : {};
        return {
          ...current,
          players: {
            ...rawPlayers,
            [returningPlayer.id]: {
              ...existingPlayerRecord,
              id: returningPlayer.id,
              name: trimmedName,
              joinedAt: returningPlayer.joinedAt,
              isHost: returningPlayer.isHost,
              color: returningPlayer.color,
              authUid,
            },
          },
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
        };
      }
    }

    if (existingPlayers.length >= MAX_ROOM_PLAYERS) {
      abortReason = 'ROOM_FULL';
      return undefined;
    }

    const newPlayerId = createPlayerId();
    localPlayerId = newPlayerId;

    return {
      ...current,
      maxPlayers: MAX_ROOM_PLAYERS,
      players: {
        ...(isRecord(current.players) ? current.players : {}),
        [newPlayerId]: {
          id: newPlayerId,
          name: trimmedName,
          joinedAt,
          isHost: false,
          color: getAvailableColor(existingPlayers),
          ...(authUid ? { authUid } : {}),
        },
      },
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
    };
  }, undefined, false);

  if (!joinResult.committed) {
    throw new Error(abortReason);
  }

  return {
    ...parseRoomState(joinResult.snapshot.val(), code),
    localPlayerId,
  };
};

export const subscribeToRoom = (
  roomCodeInput: string,
  onChange: (room: RoomState) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = roomRefForCode(code);

  const handleValue = (snapshot: firebase.database.DataSnapshot) => {
    if (!snapshot.exists()) {
      onError(new Error('ROOM_NOT_FOUND'));
      return;
    }

    onChange(parseRoomState(snapshot.val(), code));
  };

  const handleError = (error: Error) => {
    onError(error);
  };

  roomRef.on('value', handleValue, handleError);

  return () => {
    roomRef.off('value', handleValue);
  };
};

export const startRoomGame = async (
  roomCodeInput: string,
  hostPlayerId: string,
  input: StartRoomGameInput,
): Promise<RoomState> => {
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error('MISSING_QUESTIONS');
  }

  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = roomRefForCode(code);
  const now = await getEstimatedServerTime();
  let abortReason = 'START_GAME_FAILED';

  const startResult = await roomRef.transaction(current => {
    if (!isRecord(current)) {
      abortReason = 'ROOM_NOT_FOUND';
      return undefined;
    }

    const room = parseRoomState(current, code);
    const hostPlayer = room.players.find(player => player.id === hostPlayerId);

    if (!hostPlayer?.isHost || room.hostId !== hostPlayerId) {
      abortReason = 'NOT_HOST';
      return undefined;
    }

    if (room.players.length < 2) {
      abortReason = 'NOT_ENOUGH_PLAYERS';
      return undefined;
    }

    if (room.status === 'in_game' && room.game?.phase !== 'lobby') {
      abortReason = 'ROOM_ALREADY_STARTED';
      return undefined;
    }

    const firstQuestion = input.questions[0];

    return {
      ...current,
      status: 'in_game',
      game: {
        phase: 'answering',
        questions: input.questions,
        currentQuestionIndex: 0,
        questionStartedAt: now,
        questionDeadlineAt: now + firstQuestion.timeLimitSeconds * 1000,
        revealEndsAt: null,
        responses: {},
        startedAt: now,
        completedAt: null,
      },
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
    };
  }, undefined, false);

  if (!startResult.committed) {
    throw new Error(abortReason);
  }

  return parseRoomState(startResult.snapshot.val(), code);
};

export const submitRoomAnswer = async (
  roomCodeInput: string,
  playerId: string,
  option: string,
): Promise<void> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = roomRefForCode(code);
  let abortReason = 'ANSWER_SUBMIT_FAILED';

  const submitResult = await roomRef.transaction(current => {
    if (!isRecord(current)) {
      abortReason = 'ROOM_NOT_FOUND';
      return undefined;
    }

    const room = parseRoomState(current, code);
    const game = room.game;
    const currentQuestion = game?.questions[game.currentQuestionIndex];

    if (!room.players.some(player => player.id === playerId)) {
      abortReason = 'PLAYER_NOT_FOUND';
      return undefined;
    }

    if (!game || game.phase !== 'answering' || !currentQuestion) {
      abortReason = 'ROOM_NOT_ACCEPTING_ANSWERS';
      return undefined;
    }

    if (!currentQuestion.options.includes(option)) {
      abortReason = 'INVALID_OPTION';
      return undefined;
    }

    const rawGame = isRecord(current.game) ? current.game : {};
    const rawResponses = isRecord(rawGame.responses) ? rawGame.responses : {};
    const currentQuestionResponses: Record<string, unknown> = isRecord(rawResponses[currentQuestion.id])
      ? rawResponses[currentQuestion.id] as Record<string, unknown>
      : {};

    if (typeof currentQuestionResponses[playerId] === 'string') {
      abortReason = 'ANSWER_ALREADY_SUBMITTED';
      return undefined;
    }

    return {
      ...current,
      game: {
        ...rawGame,
        responses: {
          ...rawResponses,
          [currentQuestion.id]: {
            ...currentQuestionResponses,
            [playerId]: option,
          },
        },
      },
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
    };
  }, undefined, false);

  if (!submitResult.committed && abortReason !== 'ANSWER_ALREADY_SUBMITTED') {
    throw new Error(abortReason);
  }

  await advanceRoomGameIfReady(code);
};

export const advanceRoomGameIfReady = async (
  roomCodeInput: string,
): Promise<RoomState | null> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = roomRefForCode(code);
  const now = await getEstimatedServerTime();
  let changed = false;

  const advanceResult = await roomRef.transaction(current => {
    if (!isRecord(current)) {
      return undefined;
    }

    const room = parseRoomState(current, code);
    const game = room.game;

    if (!game) {
      return undefined;
    }

    const currentQuestion = game.questions[game.currentQuestionIndex];
    const rawGame = isRecord(current.game) ? current.game : {};

    if (game.phase === 'answering') {
      if (!currentQuestion) {
        return undefined;
      }

      const rawResponses = isRecord(rawGame.responses) ? rawGame.responses : {};
      const currentQuestionResponses: Record<string, unknown> = isRecord(rawResponses[currentQuestion.id])
        ? rawResponses[currentQuestion.id] as Record<string, unknown>
        : {};
      const answerCount = Object.keys(currentQuestionResponses).filter(
        playerId => typeof currentQuestionResponses[playerId] === 'string',
      ).length;
      const deadline = game.questionDeadlineAt ?? 0;

      if (answerCount < room.players.length && now < deadline) {
        return undefined;
      }

      changed = true;
      return {
        ...current,
        game: {
          ...rawGame,
          phase: 'reveal',
          revealEndsAt: now + REVEAL_DURATION_MS,
        },
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
      };
    }

    if (game.phase === 'reveal') {
      const revealEndsAt = game.revealEndsAt ?? 0;
      if (now < revealEndsAt) {
        return undefined;
      }

      const nextQuestionIndex = game.currentQuestionIndex + 1;
      changed = true;

      if (nextQuestionIndex < game.questions.length) {
        const nextQuestion = game.questions[nextQuestionIndex];
        return {
          ...current,
          game: {
            ...rawGame,
            phase: 'answering',
            currentQuestionIndex: nextQuestionIndex,
            questionStartedAt: now,
            questionDeadlineAt: now + nextQuestion.timeLimitSeconds * 1000,
            revealEndsAt: null,
          },
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
        };
      }

      return {
        ...current,
        status: 'completed',
        game: {
          ...rawGame,
          phase: 'results',
          questionStartedAt: null,
          questionDeadlineAt: null,
          revealEndsAt: null,
          completedAt: now,
        },
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
      };
    }

    return undefined;
  }, undefined, false);

  if (!advanceResult.committed || !changed) {
    return null;
  }

  return parseRoomState(advanceResult.snapshot.val(), code);
};

export const computeRoomScores = (room: RoomState): Record<string, number> => {
  if (!room.game) {
    return {};
  }

  return room.game.questions.reduce<Record<string, number>>((accumulator, question) => {
    const questionResponses = room.game?.responses[question.id] ?? {};

    Object.entries(questionResponses).forEach(([playerId, answer]) => {
      if (answer === question.correctAnswer) {
        accumulator[playerId] = (accumulator[playerId] ?? 0) + 1;
      } else if (!(playerId in accumulator)) {
        accumulator[playerId] = 0;
      }
    });

    return accumulator;
  }, {});
};
