import { describe, expect, it } from "vitest";

import { isAllowed, parseAllowlist } from "./allowlist";

describe("allowlist", () => {
  it("parses comma-separated emails case-insensitively", () => {
    expect(parseAllowlist(" Owner@Example.com, friend@example.com ,, ")).toEqual(
      new Set(["owner@example.com", "friend@example.com"]),
    );
  });

  it("allows matching emails", async () => {
    await expect(isAllowed("OWNER@example.com", "owner@example.com")).resolves.toBe(true);
  });

  it("blocks missing and unknown emails", async () => {
    await expect(isAllowed(null, "owner@example.com")).resolves.toBe(false);
    await expect(isAllowed("other@example.com", "owner@example.com")).resolves.toBe(false);
  });
});
