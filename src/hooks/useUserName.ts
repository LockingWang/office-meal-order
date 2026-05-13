import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "omo:userName";

export function useUserName(): {
  userName: string;
  setUserName: (n: string) => void;
  clearUserName: () => void;
  ready: boolean;
} {
  const [userName, setUserNameState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY) ?? "";
      setUserNameState(v.trim());
    } catch {
      setUserNameState("");
    }
    setReady(true);
  }, []);

  const setUserName = useCallback((n: string) => {
    const trimmed = n.trim();
    try {
      if (trimmed) {
        window.localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore quota / private mode errors */
    }
    setUserNameState(trimmed);
  }, []);

  const clearUserName = useCallback(() => setUserName(""), [setUserName]);

  return { userName, setUserName, clearUserName, ready };
}
