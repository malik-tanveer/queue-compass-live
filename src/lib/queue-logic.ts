// Pure queue rules: no storage, no React. Everything here is unit-tested.

export type TicketStatus = "waiting" | "serving" | "completed" | "skipped";

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  description: string;
  active: boolean;
}

export interface Ticket {
  id: string;
  token: number;
  name: string;
  phone: string;
  serviceId: string;
  status: TicketStatus;
  joinedAt: number;
  calledAt?: number;
  finishedAt?: number;
  left?: boolean;
}

export interface Business {
  name: string;
  slug: string;
  tagline: string;
  address: string;
  counterName: string;
  isOpen: boolean;
}

export interface DayStat {
  label: string;
  customers: number;
  avgWait: number;
}

export interface QueueState {
  business: Business;
  services: Service[];
  tickets: Ticket[];
  nextToken: number;
  history: DayStat[];
}

const MIN = 60_000;

export function formatToken(token: number) {
  return `A-${String(token).padStart(3, "0")}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getService(state: QueueState, serviceId: string) {
  return state.services.find((s) => s.id === serviceId);
}

export function serviceDuration(state: QueueState, serviceId: string) {
  return getService(state, serviceId)?.duration ?? 10;
}

export function waitingTickets(state: QueueState) {
  return state.tickets
    .filter((t) => t.status === "waiting")
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

export function servingTicket(state: QueueState) {
  return state.tickets.find((t) => t.status === "serving");
}

/** Minutes left for the customer currently at the counter (never below 1 while serving). */
export function remainingServingMinutes(state: QueueState, now: number) {
  const serving = servingTicket(state);
  if (!serving) return 0;
  const elapsed = (now - (serving.calledAt ?? now)) / MIN;
  return Math.max(1, Math.ceil(serviceDuration(state, serving.serviceId) - elapsed));
}

/** Number of waiting customers ahead of this ticket. */
export function peopleAhead(state: QueueState, ticketId: string) {
  const idx = waitingTickets(state).findIndex((t) => t.id === ticketId);
  return idx < 0 ? 0 : idx;
}

/** 1-based position in the waiting line, or 0 if not waiting. */
export function positionOf(state: QueueState, ticketId: string) {
  const idx = waitingTickets(state).findIndex((t) => t.id === ticketId);
  return idx < 0 ? 0 : idx + 1;
}

/**
 * Estimated minutes until this ticket is called: the time left on the current
 * customer plus the service duration of every waiting customer ahead.
 */
export function estimateWait(state: QueueState, ticketId: string, now: number) {
  const waiting = waitingTickets(state);
  const idx = waiting.findIndex((t) => t.id === ticketId);
  if (idx < 0) return 0;
  const ahead = waiting.slice(0, idx).reduce((sum, t) => sum + serviceDuration(state, t.serviceId), 0);
  return ahead + remainingServingMinutes(state, now);
}

/** Estimated wait for someone joining right now for the given service. */
export function estimateWaitForNew(state: QueueState, now: number) {
  const ahead = waitingTickets(state).reduce((sum, t) => sum + serviceDuration(state, t.serviceId), 0);
  return ahead + remainingServingMinutes(state, now);
}

function patch(state: QueueState, id: string, changes: Partial<Ticket>): QueueState {
  return { ...state, tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...changes } : t)) };
}

/** Completes the customer at the counter and calls the first waiting customer. */
export function callNext(state: QueueState, now: number): QueueState {
  let next = state;
  const serving = servingTicket(state);
  if (serving) next = patch(next, serving.id, { status: "completed", finishedAt: now });
  const first = waitingTickets(next)[0];
  if (first) next = patch(next, first.id, { status: "serving", calledAt: now });
  return next;
}

export function completeTicket(state: QueueState, id: string, now: number): QueueState {
  return patch(state, id, { status: "completed", finishedAt: now });
}

export function skipTicket(state: QueueState, id: string, now: number, left = false): QueueState {
  return patch(state, id, { status: "skipped", finishedAt: now, left });
}

/** Puts a skipped customer back in line at their original position. */
export function restoreTicket(state: QueueState, id: string): QueueState {
  return patch(state, id, { status: "waiting", finishedAt: undefined, calledAt: undefined, left: false });
}

export interface JoinInput {
  name: string;
  phone: string;
  serviceId: string;
}

export function joinQueue(state: QueueState, input: JoinInput, now: number) {
  const ticket: Ticket = {
    id: uid(),
    token: state.nextToken,
    name: input.name.trim(),
    phone: input.phone.trim(),
    serviceId: input.serviceId,
    status: "waiting",
    joinedAt: now,
  };
  return {
    state: { ...state, tickets: [...state.tickets, ticket], nextToken: state.nextToken + 1 },
    ticket,
  };
}

export function isSameDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function todayStats(state: QueueState, now: number) {
  const today = state.tickets.filter((t) => isSameDay(t.joinedAt, now));
  const called = today.filter((t) => t.calledAt);
  const avgWait = called.length
    ? Math.round(called.reduce((s, t) => s + ((t.calledAt as number) - t.joinedAt), 0) / called.length / MIN)
    : 0;
  const served = today.filter((t) => t.status === "completed" && t.calledAt && t.finishedAt);
  const avgService = served.length
    ? Math.round(served.reduce((s, t) => s + ((t.finishedAt as number) - (t.calledAt as number)), 0) / served.length / MIN)
    : 0;
  return {
    total: today.length,
    completed: today.filter((t) => t.status === "completed").length,
    skipped: today.filter((t) => t.status === "skipped").length,
    waiting: today.filter((t) => t.status === "waiting").length,
    avgWait,
    avgService,
  };
}

const DEMO_PEOPLE: Array<[string, string, string, TicketStatus]> = [
  ["Ayesha Khan", "+1 415 555 0132", "general", "completed"],
  ["Daniel Moore", "+1 415 555 0178", "lab", "completed"],
  ["Priya Sharma", "+1 415 555 0119", "followup", "completed"],
  ["Omar Farouk", "+1 415 555 0144", "general", "completed"],
  ["Sofia Martins", "+1 415 555 0190", "lab", "skipped"],
  ["Liam Chen", "+1 415 555 0107", "followup", "completed"],
  ["Fatima Noor", "+1 415 555 0163", "general", "completed"],
  ["Marcus Webb", "+1 415 555 0125", "lab", "completed"],
  ["Hana Sato", "+1 415 555 0186", "general", "serving"],
  ["Ethan Brooks", "+1 415 555 0151", "followup", "waiting"],
  ["Zara Ahmed", "+1 415 555 0139", "general", "waiting"],
  ["Lucas Rivera", "+1 415 555 0172", "lab", "waiting"],
  ["Mei Lin", "+1 415 555 0115", "followup", "waiting"],
  ["Noah Patel", "+1 415 555 0198", "general", "waiting"],
];

/** NovaCare Clinic demo: a morning of activity relative to `now`. */
export function createDemoState(now: number): QueueState {
  const services: Service[] = [
    { id: "general", name: "General Consultation", duration: 15, description: "See a physician for new symptoms or concerns.", active: true },
    { id: "followup", name: "Follow-up Consultation", duration: 10, description: "Review results or continue an existing treatment.", active: true },
    { id: "lab", name: "Lab Test", duration: 5, description: "Blood work and sample collection.", active: true },
    { id: "vaccine", name: "Vaccination", duration: 8, description: "Seasonal and travel vaccines.", active: false },
  ];

  const start = now - 150 * MIN;
  const tickets: Ticket[] = [];
  let cursor = start;
  DEMO_PEOPLE.forEach(([name, phone, serviceId, status], i) => {
    const joinedAt = start + i * 9 * MIN + (i % 3) * 2 * MIN;
    const duration = services.find((s) => s.id === serviceId)!.duration;
    const t: Ticket = { id: `demo-${i + 1}`, token: i + 1, name, phone, serviceId, status, joinedAt };
    if (status === "completed" || status === "skipped") {
      const calledAt = Math.max(cursor, joinedAt + (6 + (i % 4) * 3) * MIN);
      t.calledAt = status === "completed" ? calledAt : undefined;
      t.finishedAt = calledAt + (status === "completed" ? duration * MIN : 2 * MIN);
      cursor = t.finishedAt;
    }
    if (status === "serving") {
      t.calledAt = now - 6 * MIN;
      t.joinedAt = now - 22 * MIN;
    }
    if (status === "waiting") {
      t.joinedAt = now - (DEMO_PEOPLE.length - i) * 4 * MIN;
    }
    tickets.push(t);
  });

  return {
    business: {
      name: "NovaCare Clinic",
      slug: "novacare",
      tagline: "Family medicine & diagnostics",
      address: "240 Market Street, San Francisco",
      counterName: "Room 1",
      isOpen: true,
    },
    services,
    tickets,
    nextToken: DEMO_PEOPLE.length + 1,
    history: [
      { label: "Mon", customers: 46, avgWait: 18 },
      { label: "Tue", customers: 52, avgWait: 21 },
      { label: "Wed", customers: 39, avgWait: 14 },
      { label: "Thu", customers: 58, avgWait: 23 },
      { label: "Fri", customers: 61, avgWait: 19 },
      { label: "Sat", customers: 33, avgWait: 11 },
    ],
  };
}
