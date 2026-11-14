import { describe, expect, it } from "vitest";
import {
  callNext,
  createDemoState,
  estimateWait,
  formatToken,
  joinQueue,
  peopleAhead,
  positionOf,
  restoreTicket,
  servingTicket,
  skipTicket,
  waitingTickets,
  type QueueState,
} from "./queue-logic";

const NOW = 1_760_000_000_000;
const MIN = 60_000;

function base(): QueueState {
  return {
    business: { name: "Test", slug: "test", tagline: "", address: "", counterName: "Room 1", isOpen: true },
    services: [
      { id: "general", name: "General Consultation", duration: 15, description: "", active: true },
      { id: "followup", name: "Follow-up Consultation", duration: 10, description: "", active: true },
      { id: "lab", name: "Lab Test", duration: 5, description: "", active: true },
    ],
    tickets: [],
    nextToken: 1,
    history: [],
  };
}

describe("queue rules", () => {
  it("issues sequential tokens formatted as A-001", () => {
    let s = base();
    const a = joinQueue(s, { name: "Ann", phone: "", serviceId: "lab" }, NOW);
    s = a.state;
    const b = joinQueue(s, { name: "Ben", phone: "", serviceId: "lab" }, NOW + 1);
    expect(formatToken(a.ticket.token)).toBe("A-001");
    expect(formatToken(b.ticket.token)).toBe("A-002");
  });

  it("Call Next completes the current customer and serves the first waiting one", () => {
    let s = base();
    s = joinQueue(s, { name: "Ann", phone: "", serviceId: "lab" }, NOW).state;
    s = joinQueue(s, { name: "Ben", phone: "", serviceId: "lab" }, NOW + 1).state;
    s = callNext(s, NOW + 2);
    expect(servingTicket(s)?.name).toBe("Ann");
    s = callNext(s, NOW + 3);
    expect(servingTicket(s)?.name).toBe("Ben");
    expect(s.tickets.find((t) => t.name === "Ann")?.status).toBe("completed");
  });

  it("estimated wait = time left at the counter + durations of everyone ahead", () => {
    let s = base();
    s = joinQueue(s, { name: "Ann", phone: "", serviceId: "general" }, NOW).state; // 15 min
    s = joinQueue(s, { name: "Ben", phone: "", serviceId: "followup" }, NOW + 1).state; // 10 min
    const c = joinQueue(s, { name: "Cat", phone: "", serviceId: "lab" }, NOW + 2);
    s = callNext(c.state, NOW); // Ann at counter, called now
    // Cat waits for Ann's remaining 15 + Ben's 10
    expect(estimateWait(s, c.ticket.id, NOW)).toBe(25);
    // 6 minutes later, Ann has 9 left
    expect(estimateWait(s, c.ticket.id, NOW + 6 * MIN)).toBe(19);
    expect(peopleAhead(s, c.ticket.id)).toBe(1);
    expect(positionOf(s, c.ticket.id)).toBe(2);
  });

  it("calling next moves everyone up one place", () => {
    let s = base();
    s = joinQueue(s, { name: "Ann", phone: "", serviceId: "lab" }, NOW).state;
    s = joinQueue(s, { name: "Ben", phone: "", serviceId: "lab" }, NOW + 1).state;
    const c = joinQueue(s, { name: "Cat", phone: "", serviceId: "lab" }, NOW + 2);
    s = c.state;
    expect(peopleAhead(s, c.ticket.id)).toBe(2);
    s = callNext(s, NOW + 3);
    expect(peopleAhead(s, c.ticket.id)).toBe(1);
  });

  it("a restored skipped customer returns to their original place", () => {
    let s = base();
    const a = joinQueue(s, { name: "Ann", phone: "", serviceId: "lab" }, NOW);
    s = joinQueue(a.state, { name: "Ben", phone: "", serviceId: "lab" }, NOW + 1).state;
    s = skipTicket(s, a.ticket.id, NOW + 2);
    expect(waitingTickets(s).map((t) => t.name)).toEqual(["Ben"]);
    s = restoreTicket(s, a.ticket.id);
    expect(waitingTickets(s).map((t) => t.name)).toEqual(["Ann", "Ben"]);
  });

  it("NovaCare demo has the requested services and a live queue", () => {
    const s = createDemoState(NOW);
    const byName = Object.fromEntries(s.services.map((x) => [x.name, x.duration]));
    expect(byName["General Consultation"]).toBe(15);
    expect(byName["Follow-up Consultation"]).toBe(10);
    expect(byName["Lab Test"]).toBe(5);
    expect(servingTicket(s)).toBeDefined();
    expect(waitingTickets(s).length).toBeGreaterThan(2);
  });
});
