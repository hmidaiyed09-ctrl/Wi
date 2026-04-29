import { firebase, firestore } from './firebaseClient';

const ROOM_CODE_LENGTH = 6;
const MAX_CREATE_ATTEMPTS = 8;

export type RoomPlayer = {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
};

export type RoomQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  timeLimitSeconds?: number;
};

export type RoomStatus = 'waiting' | 'in_game' | 'finished';

export type RoomState = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
  questions: RoomQuestion[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  answers: Record<string, Record<string, string>>;
  questionStartedAt: string | null;
};

type RoomDocument = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
  questions?: RoomQuestion[];
  currentQuestionIndex?: number;
  scores?: Record<string, number>;
  answers?: Record<string, Record<string, string>>;
  questionStartedAt?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

const sanitizeRoomCode = (input: string): string =>
  input.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH);

const createPlayerId = (): string =>
  `player_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const parseRoomState = (
  raw: Partial<RoomDocument> | undefined,
  fallbackCode: string,
): RoomState => {
  const players = Array.isArray(raw?.players)
    ? raw.players.filter(
        (player): player is RoomPlayer =>
          !!player &&
          typeof player.id === 'string' &&
          typeof player.name === 'string' &&
          typeof player.joinedAt === 'string' &&
          typeof player.isHost === 'boolean',
      )
    : [];

  const questions = Array.isArray(raw?.questions)
    ? raw.questions.filter(
        (q): q is RoomQuestion =>
          !!q &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          typeof q.correctAnswer === 'string',
      )
    : [];

  return {
    code: typeof raw?.code === 'string' ? raw.code : fallbackCode,
    roomName: typeof raw?.roomName === 'string' ? raw.roomName : 'myfriend',
    status:
      raw?.status === 'in_game' || raw?.status === 'finished'
        ? raw.status
        : 'waiting',
    hostId: typeof raw?.hostId === 'string' ? raw.hostId : '',
    players,
    questions,
    currentQuestionIndex:
      typeof raw?.currentQuestionIndex === 'number'
        ? raw.currentQuestionIndex
        : 0,
    scores:
      raw?.scores && typeof raw.scores === 'object'
        ? (raw.scores as Record<string, number>)
        : {},
    answers:
      raw?.answers && typeof raw.answers === 'object'
        ? (raw.answers as Record<string, Record<string, string>>)
        : {},
    questionStartedAt:
      typeof raw?.questionStartedAt === 'string'
        ? raw.questionStartedAt
        : null,
  };
};

const generateCandidateCode = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateUniqueRoomCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const candidateCode = generateCandidateCode();
    const snapshot = await firestore
      .collection('rooms')
      .doc(candidateCode)
      .get();
    if (!snapshot.exists) {
      return candidateCode;
    }
  }

  throw new Error('ROOM_CODE_GENERATION_FAILED');
};

export const createRoom = async (
  hostName: string,
  roomName = 'myfriend',
): Promise<RoomState> => {
  const code = await generateUniqueRoomCode();
  const hostId = createPlayerId();
  const trimmedHostName = hostName.trim() || 'Host';
  const hostPlayer: RoomPlayer = {
    id: hostId,
    name: trimmedHostName,
    joinedAt: new Date().toISOString(),
    isHost: true,
  };

  const roomPayload: RoomDocument = {
    code,
    roomName,
    status: 'waiting',
    hostId,
    players: [hostPlayer],
    questions: [],
    currentQuestionIndex: 0,
    scores: { [hostId]: 0 },
    answers: {},
    questionStartedAt: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  await firestore.collection('rooms').doc(code).set(roomPayload);

  return {
    code,
    roomName,
    status: 'waiting',
    hostId,
    players: [hostPlayer],
    questions: [],
    currentQuestionIndex: 0,
    scores: { [hostId]: 0 },
    answers: {},
    questionStartedAt: null,
  };
};

export const joinRoom = async (
  roomCodeInput: string,
  playerName: string,
): Promise<{ room: RoomState; localPlayerId: string }> => {
  const code = sanitizeRoomCode(roomCodeInput);

  if (code.length !== ROOM_CODE_LENGTH) {
    throw new Error('INVALID_ROOM_CODE');
  }

  const roomRef = firestore.collection('rooms').doc(code);
  const roomSnapshot = await roomRef.get();

  if (!roomSnapshot.exists) {
    throw new Error('ROOM_NOT_FOUND');
  }

  const guestId = createPlayerId();
  const guestPlayer: RoomPlayer = {
    id: guestId,
    name: playerName.trim() || 'Guest',
    joinedAt: new Date().toISOString(),
    isHost: false,
  };

  await roomRef.update({
    players: firebase.firestore.FieldValue.arrayUnion(guestPlayer),
    [`scores.${guestId}`]: 0,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  const updatedSnapshot = await roomRef.get();
  return {
    room: parseRoomState(
      updatedSnapshot.data() as Partial<RoomDocument> | undefined,
      code,
    ),
    localPlayerId: guestId,
  };
};

export const leaveRoom = async (
  roomCodeInput: string,
  playerId: string,
): Promise<void> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);
  const snapshot = await roomRef.get();

  if (!snapshot.exists) {
    return;
  }

  const room = parseRoomState(
    snapshot.data() as Partial<RoomDocument> | undefined,
    code,
  );
  const remainingPlayers = room.players.filter(p => p.id !== playerId);

  if (remainingPlayers.length === 0) {
    await roomRef.delete();
    return;
  }

  await roomRef.update({
    players: remainingPlayers,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const startRoomGame = async (
  roomCodeInput: string,
  _hostPlayerId: string,
  payload: { questions: Array<Record<string, unknown>> },
): Promise<void> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);

  await roomRef.update({
    status: 'in_game',
    questions: payload.questions,
    currentQuestionIndex: 0,
    answers: {},
    questionStartedAt: new Date().toISOString(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const submitAnswer = async (
  roomCodeInput: string,
  playerId: string,
  questionIndex: number,
  answer: string,
): Promise<void> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);

  await firestore.runTransaction(async tx => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const data = snap.data() as Partial<RoomDocument> | undefined;
    const room = parseRoomState(data, code);

    const alreadyAnswered =
      room.answers?.[playerId]?.[String(questionIndex)] !== undefined;
    if (alreadyAnswered) {
      return;
    }

    const question = room.questions[questionIndex];
    if (!question) {
      throw new Error('QUESTION_NOT_FOUND');
    }

    const isCorrect = question.correctAnswer === answer;
    const newScore = (room.scores?.[playerId] ?? 0) + (isCorrect ? 1 : 0);

    tx.update(roomRef, {
      [`answers.${playerId}.${questionIndex}`]: answer,
      [`scores.${playerId}`]: newScore,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
};

export const advanceQuestion = async (
  roomCodeInput: string,
  _hostId: string,
): Promise<void> => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);
  const snap = await roomRef.get();
  if (!snap.exists) {
    throw new Error('ROOM_NOT_FOUND');
  }
  const room = parseRoomState(
    snap.data() as Partial<RoomDocument> | undefined,
    code,
  );
  const next = room.currentQuestionIndex + 1;

  if (next >= room.questions.length) {
    await roomRef.update({
      status: 'finished',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  await roomRef.update({
    currentQuestionIndex: next,
    questionStartedAt: new Date().toISOString(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const subscribeToRoom = (
  roomCodeInput: string,
  onChange: (room: RoomState) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);

  return roomRef.onSnapshot(
    snapshot => {
      if (!snapshot.exists) {
        onError(new Error('ROOM_NOT_FOUND'));
        return;
      }

      onChange(
        parseRoomState(
          snapshot.data() as Partial<RoomDocument> | undefined,
          code,
        ),
      );
    },
    error => {
      onError(error as Error);
    },
  );
};
