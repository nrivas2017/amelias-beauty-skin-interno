import type { FunctionComponent } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SchoolIcon from "@mui/icons-material/School";
import GroupIcon from "@mui/icons-material/Group";

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

import logo from "../assets/logo.png";

const DRAWER_WIDTH = 256;

const MainLayout: FunctionComponent = () => {
  const location = useLocation();

  const navItems = [
    { name: "Agenda", to: "/", icon: CalendarMonthIcon },
    { name: "Reservas", to: "/reservations", icon: ContentPasteIcon },
    { name: "Pacientes", to: "/patients", icon: PermContactCalendarIcon },
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
        bgcolor: "grey.50",
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
            <Typography variant="subtitle1" fontWeight="bold">
              Amelia's Beauty Skin
            </Typography>
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
