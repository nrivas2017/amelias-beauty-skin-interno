import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode, FunctionComponent } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  /** Modo actual del tema: 'light' o 'dark' */
  mode: ThemeMode;
  /** Alterna entre modo claro y oscuro */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "agenda-amelias-theme-mode";

/**
 * Lee el modo guardado en localStorage.
 * Si no hay valor guardado, retorna 'light' como predeterminado.
 */
function getSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // Si localStorage no está disponible, se usa el modo predeterminado
  }
  return "light";
}

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: FunctionComponent<ThemeProviderProps> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(getSavedMode);

  // Guardar la preferencia en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Falló al guardar
    }
  }, [mode]);

  // Aplicar o quitar la clase 'dark-mode' al <body> para estilos CSS globales
  useEffect(() => {
    if (mode === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  }, []);

  // Crear el tema MUI basado en el modo actual
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({ mode, toggleTheme }),
    [mode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Hook para acceder al contexto del tema.
 * Devuelve el modo actual y la función para alternar.
 */
export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useThemeMode debe usarse dentro de un ThemeContextProvider",
    );
  }
  return context;
}
