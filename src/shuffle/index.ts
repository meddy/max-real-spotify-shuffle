import type { LikedTrack } from "../spotify/types";
import { fisherYatesShuffle } from "./fisherYates";
import type { RandomSource } from "./fisherYates";
import { recencyWeight, neglectedWeight } from "./weights";
import { weightedShuffle } from "./weightedShuffle";

export type ShuffleMode = "pure-random" | "recently-added" | "neglected";

export const SHUFFLE_MODE_LABELS: Record<ShuffleMode, string> = {
  "pure-random": "Pure Random",
  "recently-added": "Favor Recently Added",
  neglected: "Favor Neglected",
};

export function shuffleTracks(
  tracks: readonly LikedTrack[],
  mode: ShuffleMode,
  now = new Date(),
  random?: RandomSource,
): LikedTrack[] {
  switch (mode) {
    case "pure-random":
      return fisherYatesShuffle(tracks, random);
    case "recently-added":
      return weightedShuffle(tracks, (track) => recencyWeight(track.addedAt, now), random);
    case "neglected":
      return weightedShuffle(tracks, (track) => neglectedWeight(track.addedAt, now), random);
  }
}
