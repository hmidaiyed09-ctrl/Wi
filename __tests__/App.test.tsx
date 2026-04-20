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

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
