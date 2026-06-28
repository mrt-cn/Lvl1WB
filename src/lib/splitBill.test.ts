import { describe, it, expect } from "vitest";
import { splitBill } from "./splitBill";

describe("splitBill", () => {
  it("divides evenly", () => {
    expect(splitBill(100, 4)).toEqual({ perPerson: "25.0000000", error: null });
  });
  it("rounds to 7 decimals", () => {
    expect(splitBill(10, 3)).toEqual({ perPerson: "3.3333333", error: null });
  });
  it("rejects zero or negative total", () => {
    expect(splitBill(0, 2)).toEqual({ perPerson: "0", error: "Toplam tutar 0'dan büyük olmalı." });
    expect(splitBill(-5, 2).error).toBeTruthy();
  });
  it("rejects non-finite total", () => {
    expect(splitBill(Infinity, 2).error).toBeTruthy();
  });
  it("rejects fewer than 1 person", () => {
    expect(splitBill(100, 0).error).toBeTruthy();
  });
  it("rejects non-integer people", () => {
    expect(splitBill(100, 2.5).error).toBeTruthy();
  });
});
