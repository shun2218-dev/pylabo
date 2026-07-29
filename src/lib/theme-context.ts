import { createContext, useContext } from "react";

import type { ThemeName } from "./storage";

interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
