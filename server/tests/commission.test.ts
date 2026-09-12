import { describe, expect, it } from "vitest";
import { calculateCommission } from "../src/services/commission.service";

describe("calculateCommission", () => {
  it("splits gross into commission and vendor earning at the given rate", () => {
    const result = calculateCommission(100, 2, 10);
    expect(result.gross).toBe(200);
    expect(result.commissionAmount).toBe(20);
    expect(result.vendorEarning).toBe(180);
  });

  it("handles a zero commission rate", () => {
    const result = calculateCommission(50, 1, 0);
    expect(result.commissionAmount).toBe(0);
    expect(result.vendorEarning).toBe(50);
  });

  it("handles a 100% commission rate", () => {
    const result = calculateCommission(50, 1, 100);
    expect(result.commissionAmount).toBe(50);
    expect(result.vendorEarning).toBe(0);
  });

  it("rounds to two decimal places", () => {
    const result = calculateCommission(19.99, 3, 12.5);
    expect(result.gross).toBe(59.97);
    expect(Number.isInteger(result.commissionAmount * 100)).toBe(true);
    expect(result.commissionAmount + result.vendorEarning).toBeCloseTo(result.gross, 2);
  });

  it("keeps gross equal to commission plus vendor earning for varied inputs", () => {
    const cases: [number, number, number][] = [
      [10, 1, 5],
      [999.99, 4, 33.33],
      [1, 100, 20],
    ];
    for (const [unitPrice, quantity, rate] of cases) {
      const r = calculateCommission(unitPrice, quantity, rate);
      expect(r.commissionAmount + r.vendorEarning).toBeCloseTo(r.gross, 2);
    }
  });
});
