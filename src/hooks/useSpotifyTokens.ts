import { useCallback, useEffect, useState } from "react";

import { startSpotifyAuthorization } from "../auth/spotifyAuth";
import { clearSpotifyToken, loadSpotifyToken, StoredSpotifyToken } from "../auth/spotifyTokenStore";

export function useSpotifyTokens() {
  const [token, setToken] = useState<StoredSpotifyToken | null>(() => loadSpotifyToken());

  const refreshFromStorage = useCallback(() => {
    setToken(loadSpotifyToken());
  }, []);

  useEffect(() => {
    const onStorage = () => {
      refreshFromStorage();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshFromStorage]);

  const connect = useCallback(async () => {
    await startSpotifyAuthorization();
  }, []);

  const disconnect = useCallback(() => {
    clearSpotifyToken();
    setToken(null);
  }, []);

  return {
    token,
    connected: Boolean(token?.refresh_token),
    connect,
    disconnect,
    refreshFromStorage,
  };
}
