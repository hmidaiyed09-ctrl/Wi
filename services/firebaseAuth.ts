import { Platform } from 'react-native';
import type firebase from 'firebase/compat/app';
import { auth, firebase as firebaseCompat, firestore } from './firebaseClient';

export type QuizLanguage = 'ARABIC' | 'ENGLISH';

export type UserProfile = {
  uid: string;
  username: string;
  email: string;
  providerId: string;
  preferredLanguage: QuizLanguage;
};

export type QuizHistoryEntry = {
  category: string;
  score: number;
  total: number;
  date: string;
  isFirst: boolean;
};

type UserDocument = {
  username: string;
  email: string;
  providerId: string;
  preferredLanguage?: QuizLanguage;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type QuizHistoryDocument = {
  category?: unknown;
  score?: unknown;
  total?: unknown;
  date?: unknown;
  isFirst?: unknown;
  createdAt?: unknown;
};

const usersCollection = firestore.collection('users');
let authPersistenceInitialized = false;

export const initializeAuth = async (): Promise<void> => {
  if (authPersistenceInitialized || Platform.OS !== 'web') {
    return;
  }

  try {
    await auth.setPersistence(firebaseCompat.auth.Auth.Persistence.LOCAL);
    authPersistenceInitialized = true;
  } catch {
    await auth.setPersistence(firebaseCompat.auth.Auth.Persistence.SESSION);
    authPersistenceInitialized = true;
  }
};

const getFallbackUsername = (user: firebase.User): string => {
  if (typeof user.displayName === 'string' && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0].trim() || 'User';
  }

  return 'User';
};

const normalizePreferredLanguage = (value: unknown): QuizLanguage =>
  value === 'ARABIC' ? 'ARABIC' : 'ENGLISH';

const getProviderId = (user: firebase.User): string =>
  user.providerData?.[0]?.providerId ?? 'password';

const toUserProfile = (
  user: firebase.User,
  data: Partial<UserDocument> | undefined,
): UserProfile => ({
  uid: user.uid,
  username:
    typeof data?.username === 'string' && data.username.trim().length > 0
      ? data.username.trim()
      : getFallbackUsername(user),
  email:
    typeof data?.email === 'string' && data.email.trim().length > 0
      ? data.email.trim()
      : (user.email ?? ''),
  providerId:
    typeof data?.providerId === 'string' && data.providerId.trim().length > 0
      ? data.providerId
      : getProviderId(user),
  preferredLanguage: normalizePreferredLanguage(data?.preferredLanguage),
});

const ensureUserProfile = async (
  user: firebase.User,
  options: { preferredUsername?: string; providerOverride?: string } = {},
): Promise<UserProfile> => {
  const userRef = usersCollection.doc(user.uid);
  const profileSnapshot = await userRef.get();
  const normalizedPreferredUsername = options.preferredUsername?.trim();

  if (!profileSnapshot.exists) {
    if (options.providerOverride === 'google.com' && !normalizedPreferredUsername) {
      throw new Error('GOOGLE_USERNAME_REQUIRED');
    }

    const username = normalizedPreferredUsername || getFallbackUsername(user);
    const providerId = options.providerOverride ?? getProviderId(user);
    const profilePayload: UserDocument = {
      username,
      email: user.email ?? '',
      providerId,
      preferredLanguage: 'ENGLISH',
    };

    await userRef.set({
      ...profilePayload,
      createdAt: firebaseCompat.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebaseCompat.firestore.FieldValue.serverTimestamp(),
    });

    if (user.displayName !== username) {
      await user.updateProfile({ displayName: username });
    }

    return toUserProfile(user, profilePayload);
  }

  const existingData = profileSnapshot.data() as Partial<UserDocument> | undefined;
  let username =
    typeof existingData?.username === 'string' && existingData.username.trim().length > 0
      ? existingData.username.trim()
      : '';

  const updates: Partial<UserDocument> = {};
  if (!username) {
    username = normalizedPreferredUsername || getFallbackUsername(user);
    updates.username = username;
  }

  if (!existingData?.email && user.email) {
    updates.email = user.email;
  }

  if (!existingData?.providerId) {
    updates.providerId = options.providerOverride ?? getProviderId(user);
  }

  if (!existingData?.preferredLanguage) {
    updates.preferredLanguage = 'ENGLISH';
  }

  if (Object.keys(updates).length > 0) {
    await userRef.set(
      {
        ...updates,
        updatedAt: firebaseCompat.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  if (username && user.displayName !== username) {
    await user.updateProfile({ displayName: username });
  }

  return toUserProfile(user, {
    ...existingData,
    ...updates,
    username,
  });
};

export const onAuthStateChanged = (
  callback: (user: firebase.User | null) => void,
  onError?: (error: Error) => void,
): firebase.Unsubscribe => auth.onAuthStateChanged(callback, onError);

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const profileSnapshot = await usersCollection.doc(currentUser.uid).get();
  if (!profileSnapshot.exists) {
    return ensureUserProfile(currentUser);
  }

  return toUserProfile(
    currentUser,
    profileSnapshot.data() as Partial<UserDocument> | undefined,
  );
};

export const signUpWithEmail = async (
  username: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  const credential = await auth.createUserWithEmailAndPassword(email, password);
  const user = credential.user;
  if (!user) {
    throw new Error('AUTH_USER_MISSING');
  }

  await user.updateProfile({ displayName: username.trim() });
  return ensureUserProfile(user, {
    preferredUsername: username.trim(),
    providerOverride: 'password',
  });
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<UserProfile> => {
  const credential = await auth.signInWithEmailAndPassword(email, password);
  const user = credential.user;
  if (!user) {
    throw new Error('AUTH_USER_MISSING');
  }

  return ensureUserProfile(user);
};

export const signInWithGoogle = async (
  preferredUsername?: string,
): Promise<UserProfile> => {
  if (Platform.OS !== 'web') {
    throw new Error('GOOGLE_SIGN_IN_WEB_ONLY');
  }

  const provider = new firebaseCompat.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await auth.signInWithPopup(provider);
  const user = credential.user;
  if (!user) {
    throw new Error('AUTH_USER_MISSING');
  }

  const normalizedPreferredUsername = preferredUsername?.trim();
  const profileSnapshot = await usersCollection.doc(user.uid).get();
  if (!profileSnapshot.exists && !normalizedPreferredUsername) {
    await auth.signOut();
    throw new Error('GOOGLE_USERNAME_REQUIRED');
  }

  return ensureUserProfile(user, {
    preferredUsername: normalizedPreferredUsername,
    providerOverride: 'google.com',
  });
};

export const signOutUser = async (): Promise<void> => {
  await auth.signOut();
};

const parseQuizHistoryEntry = (raw: QuizHistoryDocument): QuizHistoryEntry | null => {
  if (
    typeof raw.category !== 'string'
    || typeof raw.score !== 'number'
    || typeof raw.total !== 'number'
    || typeof raw.date !== 'string'
    || typeof raw.isFirst !== 'boolean'
  ) {
    return null;
  }

  return {
    category: raw.category,
    score: raw.score,
    total: raw.total,
    date: raw.date,
    isFirst: raw.isFirst,
  };
};

export const loadQuizHistory = async (uid: string): Promise<QuizHistoryEntry[]> => {
  const snapshot = await usersCollection
    .doc(uid)
    .collection('quizHistory')
    .orderBy('date', 'asc')
    .get();

  const entries: QuizHistoryEntry[] = [];
  snapshot.forEach((doc) => {
    const parsed = parseQuizHistoryEntry(doc.data() as QuizHistoryDocument);
    if (parsed) {
      entries.push(parsed);
    }
  });

  return entries;
};

export const saveQuizHistoryEntry = async (
  uid: string,
  entry: QuizHistoryEntry,
): Promise<void> => {
  await usersCollection
    .doc(uid)
    .collection('quizHistory')
    .add({
      ...entry,
      createdAt: firebaseCompat.firestore.FieldValue.serverTimestamp(),
    });
};

export const savePreferredLanguage = async (
  uid: string,
  language: QuizLanguage,
): Promise<void> => {
  await usersCollection.doc(uid).set(
    {
      preferredLanguage: language,
      updatedAt: firebaseCompat.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

// --- Seen Questions (anti-repeat) ---

export type SeenQuestion = {
  question: string;
  createdAt: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
};

type SeenCategoryDocument = {
  questions: SeenQuestion[];
};

const QUESTIONS_LIMIT = 50;
const LOCAL_SEEN_QUESTIONS_STORAGE_KEY = 'quiz_local_seen_questions_v1';

type LocalSeenQuestionsStore = Record<string, string[]>;
type LocalSeenStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const seenQuestionsRef = (uid: string, category: string) =>
  usersCollection.doc(uid).collection('seenQuestions').doc(category);

const sanitizeQuestionList = (questions: unknown): string[] => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map(question => (typeof question === 'string' ? question.trim() : ''))
    .filter(question => question.length > 0);
};

const parseLocalSeenQuestionsStore = (value: unknown): LocalSeenQuestionsStore => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<LocalSeenQuestionsStore>(
    (accumulator, [category, questions]) => {
      const normalizedCategory = category.trim();
      if (!normalizedCategory) {
        return accumulator;
      }

      accumulator[normalizedCategory] = sanitizeQuestionList(questions).slice(-QUESTIONS_LIMIT);
      return accumulator;
    },
    {},
  );
};

const mergeSeenQuestionLists = (
  existingQuestions: string[],
  newQuestions: string[],
): string[] => {
  const sanitizedNewQuestions = sanitizeQuestionList(newQuestions);
  const merged = [...existingQuestions, ...sanitizedNewQuestions];
  return merged.slice(-QUESTIONS_LIMIT);
};

let nativeSeenStoragePromise: Promise<LocalSeenStorage> | null = null;

const createWebSeenStorage = (): LocalSeenStorage => {
  if (typeof window === 'undefined') {
    throw new Error('WEB_STORAGE_UNAVAILABLE');
  }

  const webStorage = window.localStorage;
  return {
    getItem: async key => webStorage.getItem(key),
    setItem: async (key, value) => {
      webStorage.setItem(key, value);
    },
  };
};

const getNativeSeenStorage = async (): Promise<LocalSeenStorage> => {
  if (!nativeSeenStoragePromise) {
    nativeSeenStoragePromise = import('@react-native-async-storage/async-storage')
      .then(module => {
        const storage = module.default;
        if (
          !storage ||
          typeof storage.getItem !== 'function' ||
          typeof storage.setItem !== 'function'
        ) {
          throw new Error('NATIVE_STORAGE_UNAVAILABLE');
        }

        return {
          getItem: async key => storage.getItem(key),
          setItem: async (key, value) => {
            await storage.setItem(key, value);
          },
        };
      });
  }

  return nativeSeenStoragePromise;
};

const getSeenStorage = async (): Promise<LocalSeenStorage> => {
  if (Platform.OS === 'web') {
    return createWebSeenStorage();
  }

  return getNativeSeenStorage();
};

const readLocalSeenQuestionsStore = async (): Promise<LocalSeenQuestionsStore> => {
  let rawValue: string | null = null;
  try {
    const storage = await getSeenStorage();
    rawValue = await storage.getItem(LOCAL_SEEN_QUESTIONS_STORAGE_KEY);
  } catch {
    throw new Error('LOCAL_SEEN_CACHE_READ_FAILED');
  }

  if (!rawValue) {
    return {};
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(rawValue) as unknown;
  } catch {
    throw new Error('LOCAL_SEEN_CACHE_CORRUPTED');
  }

  return parseLocalSeenQuestionsStore(parsedValue);
};

const writeLocalSeenQuestionsStore = async (
  store: LocalSeenQuestionsStore,
): Promise<void> => {
  try {
    const storage = await getSeenStorage();
    await storage.setItem(
      LOCAL_SEEN_QUESTIONS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    throw new Error('LOCAL_SEEN_CACHE_WRITE_FAILED');
  }
};

export const loadSeenQuestions = async (
  uid: string,
  category: string,
): Promise<SeenQuestion[]> => {
  const snapshot = await seenQuestionsRef(uid, category).get();
  if (!snapshot.exists) {
    return [];
  }
  const data = snapshot.data() as Partial<SeenCategoryDocument> | undefined;
  if (!Array.isArray(data?.questions)) {
    return [];
  }
  return data.questions;
};

export const saveSeenQuestionsAfterQuiz = async (
  uid: string,
  category: string,
  newQuestions: SeenQuestion[],
): Promise<void> => {
  const docRef = seenQuestionsRef(uid, category);
  const snapshot = await docRef.get();

  let existingQuestions: SeenQuestion[] = [];
  if (snapshot.exists) {
    const data = snapshot.data() as Partial<SeenCategoryDocument> | undefined;
    existingQuestions = Array.isArray(data?.questions) ? data.questions : [];
  }

  let updatedQuestions = [...existingQuestions, ...newQuestions];

  if (updatedQuestions.length > QUESTIONS_LIMIT) {
    updatedQuestions = updatedQuestions.slice(updatedQuestions.length - QUESTIONS_LIMIT);
  }

  await docRef.set({ questions: updatedQuestions });
};

export const loadLocalSeenQuestions = async (
  category: string,
): Promise<string[]> => {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error('INVALID_CATEGORY');
  }

  const localStore = await readLocalSeenQuestionsStore();
  return localStore[normalizedCategory] ?? [];
};

export const saveLocalSeenQuestionsAfterQuiz = async (
  category: string,
  newQuestions: string[],
): Promise<string[]> => {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error('INVALID_CATEGORY');
  }

  const localStore = await readLocalSeenQuestionsStore();
  const existingQuestions = localStore[normalizedCategory] ?? [];
  const updatedQuestions = mergeSeenQuestionLists(existingQuestions, newQuestions);
  localStore[normalizedCategory] = updatedQuestions;
  await writeLocalSeenQuestionsStore(localStore);
  return updatedQuestions;
};
