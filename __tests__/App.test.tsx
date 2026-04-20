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
    players: [{ id: 'host', name: 'User', joinedAt: new Date().toISOString(), isHost: true }],
  })),
  joinRoom: jest.fn(async () => ({
    code: '123456',
    roomName: 'myfriend',
    status: 'waiting',
    hostId: 'host',
    players: [{ id: 'host', name: 'User', joinedAt: new Date().toISOString(), isHost: true }],
  })),
  subscribeToRoom: jest.fn(() => () => {}),
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
  loadQuizHistory: jest.fn(async () => []),
  saveQuizHistoryEntry: jest.fn(async () => {}),
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
