import type { FunctionComponent } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";
import LayersIcon from "@mui/icons-material/Layers";
import ViewListIcon from "@mui/icons-material/ViewList";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import logo from "../assets/logo.png";
import { useThemeMode } from "../contexts/ThemeContext";

const DRAWER_WIDTH = 256;

const MainLayout: FunctionComponent = () => {
  const location = useLocation();
  const { mode, toggleTheme } = useThemeMode();

  const navItems = [
    { name: "Agenda", to: "/", icon: CalendarMonthIcon },
    { name: "Reservas", to: "/reservations", icon: ContentPasteIcon },
    { name: "Pacientes", to: "/patients", icon: PermContactCalendarIcon },
    { name: "Parámetros Láser", to: "/laser-parameters", icon: ViewListIcon },
    { name: "Zonas Láser", to: "/laser-zones", icon: LayersIcon },
    { name: "Servicios", to: "/services", icon: MedicalServicesIcon },
    { name: "Especialidades", to: "/specialties", icon: SchoolIcon },
    { name: "Personal", to: "/staff", icon: GroupIcon },
  ];

  const drawerContent = (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignSelf: "center",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Amelia's Beauty Skin"
          sx={{
            height: 120,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Box>
      <Divider />

      <List
        sx={{
          flexGrow: 1,
          px: 2,
          py: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.50",
                    color: "primary.700",
                    "& .MuiListItemIcon-root": {
                      color: "primary.700",
                    },
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "primary.100",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Botón de cambio de tema */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 1.5,
        }}
      >
        <Tooltip
          title={
            mode === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
          }
          arrow
        >
          <IconButton
            id="theme-toggle-button"
            onClick={toggleTheme}
            sx={{
              transition: "all 0.3s ease",
              color: mode === "light" ? "grey.700" : "warning.300",
              bgcolor: mode === "light" ? "grey.100" : "rgba(255,183,77,0.12)",
              "&:hover": {
                bgcolor:
                  mode === "light" ? "grey.200" : "rgba(255,183,77,0.24)",
                transform: "rotate(30deg)",
              },
            }}
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          V1.0 - Acceso Interno
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        bgcolor: mode === "light" ? "grey.50" : "background.default",
      }}
    >
      <Box
        component="nav"
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
          display: { xs: "none", md: "block" },
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            display: { xs: "block", md: "none" },
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar variant="dense">
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ flexGrow: 1 }}
            >
              Amelia's Beauty Skin
            </Typography>

            {/* Botón de tema en el AppBar móvil */}
            <Tooltip
              title={mode === "light" ? "Modo oscuro" : "Modo claro"}
              arrow
            >
              <IconButton
                onClick={toggleTheme}
                size="small"
                sx={{
                  color: mode === "light" ? "grey.700" : "warning.300",
                }}
              >
                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: "auto", p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
