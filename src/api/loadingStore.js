/**
 * A tiny framework-free pub/sub store tracking how many API requests are
 * currently in flight. axios.js increments/decrements it in its interceptors;
 * useApiLoading() (via React's useSyncExternalStore) lets any component
 * react to "is anything loading right now" without prop drilling or a
 * context re-render cascade on every request.
 */
import { useSyncExternalStore } from 'react';

let activeRequestCount = 0;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function startRequest() {
  activeRequestCount += 1;
  notify();
}

export function endRequest() {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  notify();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return activeRequestCount > 0;
}

export function useApiLoading() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
