// Client-side queue store persisted in localStorage and synced live across tabs.
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  callNext,
  completeTicket,
  createDemoState,
  joinQueue,
  restoreTicket,
  skipTicket,
  uid,
  type Business,
  type JoinInput,
  type QueueState,
  type Service,
} from "./queue-logic";

const KEY = "queueflow:state:v1";
const MY_TICKETS_KEY = "queueflow:my-tickets";
export const JUST_JOINED_KEY = "queueflow:just-joined";

let state: QueueState | null = null;
const listeners = new Set<() => void>();

function load(): QueueState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as QueueState;
  } catch {
    // fall through to demo data
  }
  const demo = createDemoState(Date.now());
  window.localStorage.setItem(KEY, JSON.stringify(demo));
  return demo;
}

function getSnapshot(): QueueState {
  if (!state) state = load();
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  state = e.newValue ? (JSON.parse(e.newValue) as QueueState) : load();
  emit();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function setState(next: QueueState) {
  state = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

/** Returns null during SSR and the first hydration pass; render a skeleton then. */
export function useQueueState(): QueueState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Ticking clock so wait estimates stay fresh. */
export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const queue = {
  callNext() {
    const before = getSnapshot();
    setState(callNext(before, Date.now()));
    return getSnapshot().tickets.find((t) => t.status === "serving");
  },
  complete(id: string) {
    setState(completeTicket(getSnapshot(), id, Date.now()));
  },
  skip(id: string, left = false) {
    setState(skipTicket(getSnapshot(), id, Date.now(), left));
  },
  restore(id: string) {
    setState(restoreTicket(getSnapshot(), id));
  },
  join(input: JoinInput) {
    const result = joinQueue(getSnapshot(), input, Date.now());
    setState(result.state);
    rememberTicket(result.ticket.id);
    return result.ticket;
  },
  addWalkIn(input: JoinInput) {
    const result = joinQueue(getSnapshot(), input, Date.now());
    setState(result.state);
    return result.ticket;
  },
  setOpen(isOpen: boolean) {
    const s = getSnapshot();
    setState({ ...s, business: { ...s.business, isOpen } });
  },
  updateBusiness(changes: Partial<Business>) {
    const s = getSnapshot();
    setState({ ...s, business: { ...s.business, ...changes } });
  },
  addService(input: Omit<Service, "id">) {
    const s = getSnapshot();
    const service = { ...input, id: uid() };
    setState({ ...s, services: [...s.services, service] });
    return service;
  },
  updateService(id: string, changes: Partial<Service>) {
    const s = getSnapshot();
    setState({ ...s, services: s.services.map((x) => (x.id === id ? { ...x, ...changes } : x)) });
  },
  removeService(id: string) {
    const s = getSnapshot();
    setState({ ...s, services: s.services.filter((x) => x.id !== id) });
  },
  resetDemo() {
    window.localStorage.removeItem(MY_TICKETS_KEY);
    setState(createDemoState(Date.now()));
  },
  clearToday() {
    const s = getSnapshot();
    setState({ ...s, tickets: [], nextToken: 1 });
  },
};

export function getMyTickets(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(MY_TICKETS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function rememberTicket(id: string) {
  const list = getMyTickets().filter((x) => x !== id);
  window.localStorage.setItem(MY_TICKETS_KEY, JSON.stringify([id, ...list].slice(0, 10)));
}
