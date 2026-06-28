import { describe, it, expect } from "vitest";
import { isValidAddress } from "./stellar";

describe("isValidAddress", () => {
  it("accepts a valid public key", () => {
    expect(
      isValidAddress("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7")
    ).toBe(true);
  });
  it("rejects garbage", () => {
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });
  it("rejects a secret key", () => {
    expect(
      isValidAddress("SDLERDBI4XKAZWZN3AB2CXOWX7DGY3M6KAYZNUYDS3OYM3YVZ7K3FWJ7")
    ).toBe(false);
  });
});
