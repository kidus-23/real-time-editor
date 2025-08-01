import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isCompact: boolean;
  setCompact: (compact: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isDark: true,
  isCompact: false,
  setCompact: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "notion-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [isCompact, setIsCompact] = useState<boolean>(
    () => localStorage.getItem("notion-compact") === "true"
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    if (isCompact) {
      root.classList.add("compact");
    } else {
      root.classList.remove("compact");
    }
  }, [isCompact]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    isDark: theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
    isCompact,
    setCompact: (compact: boolean) => {
      localStorage.setItem("notion-compact", compact.toString());
      setIsCompact(compact);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
