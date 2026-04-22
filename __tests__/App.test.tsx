/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../services/firebaseRooms', () => ({
  createRoom: jest.fn(async () => ({
    code: '123456',
    roomName: 'myfriend',
    status: 'waiting',
    hostId: 'host',
    maxPlayers: 5,
    game: null,
    localPlayerId: 'host',
    players: [{ id: 'host', name: 'User', joinedAt: Date.now(), isHost: true, color: '#FF8C00' }],
  })),
  joinRoom: jest.fn(async () => ({
    code: '123456',
    roomName: 'myfriend',
    status: 'waiting',
    hostId: 'host',
    maxPlayers: 5,
    game: null,
    localPlayerId: 'host',
    players: [{ id: 'host', name: 'User', joinedAt: Date.now(), isHost: true, color: '#FF8C00' }],
  })),
  subscribeToRoom: jest.fn(() => () => {}),
  startRoomGame: jest.fn(async () => ({
    code: '123456',
    roomName: 'myfriend',
    status: 'in_game',
    hostId: 'host',
    maxPlayers: 5,
    game: {
      phase: 'answering',
      questions: [],
      currentQuestionIndex: 0,
      questionStartedAt: Date.now(),
      questionDeadlineAt: Date.now() + 30000,
      revealEndsAt: null,
      responses: {},
      startedAt: Date.now(),
      completedAt: null,
    },
    players: [{ id: 'host', name: 'User', joinedAt: Date.now(), isHost: true, color: '#FF8C00' }],
  })),
  submitRoomAnswer: jest.fn(async () => {}),
  advanceRoomGameIfReady: jest.fn(async () => null),
  computeRoomScores: jest.fn(() => ({ host: 0 })),
}));

jest.mock('../services/firebaseAuth', () => ({
  initializeAuth: jest.fn(async () => {}),
  onAuthStateChanged: jest.fn((callback: (user: null) => void) => {
    callback(null);
    return jest.fn();
  }),
  getCurrentUserProfile: jest.fn(async () => ({
    uid: 'user-1',
    username: 'User',
    email: 'user@example.com',
    providerId: 'password',
    preferredLanguage: 'ENGLISH',
  })),
  loadLocalSeenQuestions: jest.fn(async () => []),
  loadQuizHistory: jest.fn(async () => []),
  saveQuizHistoryEntry: jest.fn(async () => {}),
  saveLocalSeenQuestionsAfterQuiz: jest.fn(async () => []),
  savePreferredLanguage: jest.fn(async () => {}),
  signInWithEmail: jest.fn(async () => ({})),
  signInWithGoogle: jest.fn(async () => ({})),
  signOutUser: jest.fn(async () => {}),
  signUpWithEmail: jest.fn(async () => ({})),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
