export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyUserProfile = {
  id: string;
  display_name?: string | null;
  email?: string;
  images?: SpotifyImage[];
};

export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  owner: { id: string };
  external_urls?: { spotify?: string };
  tracks?: { total: number };
};

export type SpotifyPage<T> = {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
  next?: string | null;
};

export type SpotifySavedTrack = {
  added_at: string;
  track: {
    uri: string;
    name: string;
    artists?: Array<{ name: string }>;
  } | null;
};

export type LikedTrack = {
  uri: string;
  addedAt: string;
  name: string;
  artistNames: string[];
};

export type SpotifyApiClient = {
  currentUser: {
    profile: () => Promise<SpotifyUserProfile>;
    playlists: {
      playlists: (limit?: number, offset?: number) => Promise<SpotifyPage<SpotifyPlaylistSummary>>;
    };
    tracks: {
      savedTracks: (limit?: number, offset?: number) => Promise<SpotifyPage<SpotifySavedTrack>>;
    };
  };
  playlists: {
    getPlaylist: (playlistId: string) => Promise<SpotifyPlaylistSummary>;
  };
  makeRequest: <TReturnType>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    body?: unknown,
    contentType?: string,
  ) => Promise<TReturnType>;
};
