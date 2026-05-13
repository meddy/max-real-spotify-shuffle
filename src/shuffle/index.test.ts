import { describe, expect, it } from "vitest";

import type { LikedTrack } from "../spotify/types";
import { shuffleTracks } from ".";

const tracks: LikedTrack[] = [
  { uri: "old", addedAt: "2020-01-01T00:00:00.000Z", name: "Old", artistNames: [] },
  { uri: "new", addedAt: "2026-01-01T00:00:00.000Z", name: "New", artistNames: [] },
];

describe("shuffleTracks", () => {
  it("dispatches pure-random to Fisher-Yates", () => {
    expect(
      shuffleTracks(tracks, "pure-random", new Date(), () => 0).map((track) => track.uri),
    ).toEqual(["new", "old"]);
  });

  it("supports recently-added and neglected modes", () => {
    const now = new Date("2026-01-02T00:00:00.000Z");

    expect(shuffleTracks(tracks, "recently-added", now)).toHaveLength(2);
    expect(shuffleTracks(tracks, "neglected", now)).toHaveLength(2);
  });
});
