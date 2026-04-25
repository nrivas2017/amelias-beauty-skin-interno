import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

/**
 * Crea el tema de la aplicación según el modo indicado (light / dark).
 * La tipografía y los componentes se comparten; la paleta cambia.
 */
export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            // Paleta oscura
            background: {
              default: "#121212",
              paper: "#1e1e1e",
            },
            primary: {
              main: "#90caf9",
              light: "#e3f2fd",
              dark: "#42a5f5",
            },
            secondary: {
              main: "#ce93d8",
              light: "#f3e5f5",
              dark: "#ab47bc",
            },
            warning: {
              main: "#ffb74d",
              light: "#ffe0b2",
              dark: "#f57c00",
            },
            info: {
              main: "#4fc3f7",
              light: "#b3e5fc",
              dark: "#0288d1",
            },
            text: {
              primary: "#e0e0e0",
              secondary: "#aaaaaa",
            },
            divider: "rgba(255,255,255,0.12)",
            // Reasignar los grises para que grey.50, grey.100 etc.
            // se vean correctamente en modo oscuro
            grey: {
              50: "#2a2a2a",
              100: "#333333",
              200: "#424242",
              300: "#616161",
              400: "#757575",
              500: "#9e9e9e",
              600: "#bdbdbd",
              700: "#e0e0e0",
              800: "#eeeeee",
              900: "#f5f5f5",
            },
          }
        : {
            // Paleta clara (valores por defecto de MUI)
            background: {
              default: "#ffffff",
              paper: "#ffffff",
            },
          }),
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',

      h1: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 700,
        fontSize: "2.5rem",
      },
      h2: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 700,
        fontSize: "2rem",
      },
      h3: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        fontSize: "1.75rem",
      },
      h4: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        fontSize: "1.5rem",
      },
      h5: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        fontSize: "1.25rem",
      },
      h6: {
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        fontSize: "1.125rem",
      },

      subtitle1: { fontWeight: 500, fontSize: "1rem" },
      subtitle2: { fontWeight: 600, fontSize: "0.875rem" },

      body1: { fontSize: "1rem", fontWeight: 400 },
      body2: { fontSize: "0.875rem", fontWeight: 400 },

      button: {
        fontWeight: 600,
        textTransform: "none",
        fontSize: "0.875rem",
        letterSpacing: "0.02em",
      },

      caption: { fontSize: "0.75rem", fontWeight: 400, color: "#64748b" },
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 12,
          },
        },
      },
    },
  });
}
