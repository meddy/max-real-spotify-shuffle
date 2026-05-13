import { useEffect, useMemo, useState } from "react";

import { isAllowed } from "./auth/allowlist";
import { useAuth } from "./auth/AuthProvider";
import { handleSpotifyRedirectFromUrl } from "./auth/spotifyAuth";
import { BlockedScreen } from "./components/BlockedScreen";
import { ConnectSpotifyScreen } from "./components/ConnectSpotifyScreen";
import { LoginScreen } from "./components/LoginScreen";
import { MainScreen } from "./components/MainScreen";
import { useSpotifyTokens } from "./hooks/useSpotifyTokens";
import { createSpotifyApi } from "./spotify/client";
import type { SpotifyApiClient } from "./spotify/types";

export function App() {
  const { loading: authLoading, user, signIn, signOut } = useAuth();
  const spotifyTokens = useSpotifyTokens();
  const {
    connected: spotifyConnected,
    connect: connectSpotify,
    disconnect: disconnectSpotify,
    refreshFromStorage,
    token: spotifyToken,
  } = spotifyTokens;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [spotifyApi, setSpotifyApi] = useState<SpotifyApiClient | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [spotifyBootDone, setSpotifyBootDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function handleRedirect() {
      try {
        const handled = await handleSpotifyRedirectFromUrl();
        if (handled) {
          refreshFromStorage();
        }
      } catch (error) {
        setBootError(error instanceof Error ? error.message : "Unable to complete Spotify login.");
      } finally {
        if (!cancelled) {
          setSpotifyBootDone(true);
        }
      }
    }

    void handleRedirect();

    return () => {
      cancelled = true;
    };
  }, [refreshFromStorage]);

  useEffect(() => {
    let cancelled = false;

    async function checkAllowlist() {
      if (!user?.email) {
        setAllowed(null);
        return;
      }

      const result = await isAllowed(user.email);
      if (!cancelled) {
        setAllowed(result);
      }
    }

    void checkAllowlist();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  useEffect(() => {
    let cancelled = false;

    async function loadApi() {
      if (!spotifyConnected) {
        setSpotifyApi(null);
        return;
      }

      const api = await createSpotifyApi();

      if (!cancelled) {
        setSpotifyApi(api);
      }
    }

    void loadApi();

    return () => {
      cancelled = true;
    };
  }, [spotifyConnected, spotifyToken]);

  const loading = authLoading || !spotifyBootDone || (user && allowed === null);
  const userEmail = user?.email ?? null;

  const shell = useMemo(() => {
    if (loading) {
      return (
        <main className="flex min-h-dvh items-center justify-center px-6 text-center text-slate-300">
          Loading Spotify True Shuffle...
        </main>
      );
    }

    if (!user) {
      return <LoginScreen onSignIn={signIn} />;
    }

    if (!allowed) {
      return <BlockedScreen email={userEmail} onSignOut={() => void signOut()} />;
    }

    if (!spotifyConnected || !spotifyApi) {
      return (
        <ConnectSpotifyScreen
          firebaseEmail={userEmail}
          onConnect={connectSpotify}
          onSignOut={() => void signOut()}
        />
      );
    }

    return (
      <MainScreen
        api={spotifyApi}
        firebaseEmail={userEmail}
        onDisconnectSpotify={disconnectSpotify}
        onSignOut={() => void signOut()}
      />
    );
  }, [
    allowed,
    connectSpotify,
    disconnectSpotify,
    loading,
    signIn,
    signOut,
    spotifyApi,
    spotifyConnected,
    user,
    userEmail,
  ]);

  return (
    <>
      {bootError ? (
        <div className="fixed inset-x-4 top-4 z-10 rounded-2xl border border-red-500/30 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-lg">
          {bootError}
        </div>
      ) : null}
      {shell}
    </>
  );
}
