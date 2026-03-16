import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { FunctionComponent } from "react";
import MainLayout from "./layouts/MainLayout";
import AgendaPage from "./pages/AgendaPage";
import ServicesPage from "./pages/ServicesPage";
import PatientsPage from "./pages/PatientsPage";
import StaffPage from "./pages/StaffPage";
import SpecialtiesPage from "./pages/SpecialtiesPage";

const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AgendaPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/specialties" element={<SpecialtiesPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
