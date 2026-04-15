import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeGender = "female" | "male";
export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  gender: ThemeGender;
  mode: ThemeMode;
  hasChoice: boolean;
  setGender: (g: ThemeGender) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  gender: "female",
  mode: "light",
  hasChoice: false,
  setGender: () => {},
  setMode: () => {},
  toggleMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function resolveDataTheme(gender: ThemeGender, mode: ThemeMode): string {
  if (gender === "female") return "female";
  if (mode === "dark") return "male-dark";
  return "male";
}

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [hasChoice, setHasChoice] = useState<boolean>(() => {
    const saved = readStorage("pickme-gender");
    return saved === "female" || saved === "male";
  });

  const [gender, setGenderState] = useState<ThemeGender>(() => {
    const saved = readStorage("pickme-gender");
    return saved === "female" || saved === "male" ? saved : "female";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = readStorage("pickme-mode");
    return saved === "light" || saved === "dark" ? saved : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      resolveDataTheme(gender, mode)
    );
    // Toggle .dark class for shadcn/Tailwind compatibility
    if (gender === "male" && mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [gender, mode]);

  const setGender = (g: ThemeGender) => {
    writeStorage("pickme-gender", g);
    if (g === "female") {
      setModeState("light");
      writeStorage("pickme-mode", "light");
    }
    setGenderState(g);
    setHasChoice(true);
  };

  const setMode = (m: ThemeMode) => {
    if (gender === "female" && m === "dark") return;
    writeStorage("pickme-mode", m);
    setModeState(m);
  };

  const toggleMode = () => {
    if (gender === "female") return;
    setMode(mode === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ gender, mode, hasChoice, setGender, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
