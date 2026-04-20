import { firebase, firestore } from './firebaseClient';

const ROOM_CODE_LENGTH = 6;
const MAX_CREATE_ATTEMPTS = 8;

export type RoomPlayer = {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
};

type RoomStatus = 'waiting' | 'in_game';

export type RoomState = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
};

type RoomDocument = {
  code: string;
  roomName: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayer[];
  createdAt: unknown;
  updatedAt: unknown;
};

const sanitizeRoomCode = (input: string): string => input.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH);

const createPlayerId = (): string =>
  `player_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const parseRoomState = (raw: Partial<RoomDocument> | undefined, fallbackCode: string): RoomState => {
  const players = Array.isArray(raw?.players)
    ? raw.players.filter(
      (player): player is RoomPlayer =>
        !!player
          && typeof player.id === 'string'
          && typeof player.name === 'string'
          && typeof player.joinedAt === 'string'
          && typeof player.isHost === 'boolean',
    )
    : [];

  return {
    code: typeof raw?.code === 'string' ? raw.code : fallbackCode,
    roomName: typeof raw?.roomName === 'string' ? raw.roomName : 'myfriend',
    status: raw?.status === 'in_game' ? 'in_game' : 'waiting',
    hostId: typeof raw?.hostId === 'string' ? raw.hostId : '',
    players,
  };
};

const generateCandidateCode = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateUniqueRoomCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const candidateCode = generateCandidateCode();
    const snapshot = await firestore.collection('rooms').doc(candidateCode).get();
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
  };
};

export const joinRoom = async (
  roomCodeInput: string,
  playerName: string,
): Promise<RoomState> => {
  const code = sanitizeRoomCode(roomCodeInput);

  if (code.length !== ROOM_CODE_LENGTH) {
    throw new Error('INVALID_ROOM_CODE');
  }

  const roomRef = firestore.collection('rooms').doc(code);
  const roomSnapshot = await roomRef.get();

  if (!roomSnapshot.exists) {
    throw new Error('ROOM_NOT_FOUND');
  }

  const guestPlayer: RoomPlayer = {
    id: createPlayerId(),
    name: playerName.trim() || 'Guest',
    joinedAt: new Date().toISOString(),
    isHost: false,
  };

  await roomRef.update({
    players: firebase.firestore.FieldValue.arrayUnion(guestPlayer),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  const updatedSnapshot = await roomRef.get();
  return parseRoomState(updatedSnapshot.data() as Partial<RoomDocument> | undefined, code);
};

export const subscribeToRoom = (
  roomCodeInput: string,
  onChange: (room: RoomState) => void,
  onError: (error: Error) => void,
): (() => void) => {
  const code = sanitizeRoomCode(roomCodeInput);
  const roomRef = firestore.collection('rooms').doc(code);

  return roomRef.onSnapshot(
    (snapshot) => {
      if (!snapshot.exists) {
        onError(new Error('ROOM_NOT_FOUND'));
        return;
      }

      onChange(parseRoomState(snapshot.data() as Partial<RoomDocument> | undefined, code));
    },
    (error) => {
      onError(error as Error);
    },
  );
};
