import type { FunctionComponent } from "react";
import { NavLink } from "react-router-dom";
import {
  Calendar,
  Users,
  BriefcaseMedical,
  Contact,
  GraduationCap,
} from "lucide-react";
import { Outlet } from "react-router-dom";

const MainLayout: FunctionComponent = () => {
  const navItems = [
    { name: "Agenda", to: "/", icon: Calendar },
    { name: "Pacientes", to: "/patients", icon: Contact },
    { name: "Servicios", to: "/services", icon: BriefcaseMedical },
    { name: "Especialidades", to: "/specialties", icon: GraduationCap },
    { name: "Personal", to: "/staff", icon: Users },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <aside className="w-64 flex-col border-r bg-white hidden md:flex">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            Amelia's Beauty Skin
          </h2>
          <p className="text-sm text-slate-500">Gestión de Agenda</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-slate-400 text-center">
          V1.0 - Acceso Interno
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-white flex items-center px-4 md:hidden">
          <span className="font-bold">Amelia's Beauty Skin</span>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
