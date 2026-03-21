import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { FunctionComponent } from "react";
import MainLayout from "./layouts/MainLayout";
import AgendaPage from "./pages/AgendaPage";
import ServicesPage from "./pages/ServicesPage";
import PatientsPage from "./pages/PatientsPage";
import StaffPage from "./pages/StaffPage";
import SpecialtiesPage from "./pages/SpecialtiesPage";
import ReservationsPage from "./pages/ReservationsPage";
import LaserZonesPage from "./pages/LaserZonesPage";
import LaserParametersPage from "./pages/LaserParametersPage";

const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AgendaPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/specialties" element={<SpecialtiesPage />} />
          <Route path="/laser-zones" element={<LaserZonesPage />} />
          <Route path="/laser-parameters" element={<LaserParametersPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
