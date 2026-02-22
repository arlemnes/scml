
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'fa-chart-pie' },
    { label: 'Clientes', path: '/clientes', icon: 'fa-users' },
    { label: 'Gestores', path: '/responsaveis', icon: 'fa-user-tie' },
    { label: 'Espaços', path: '/espacos', icon: 'fa-building' },
    { label: 'Visitas', path: '/visitas', icon: 'fa-street-view' },
    { label: 'Processos', path: '/processos', icon: 'fa-calendar-check' },
    { label: 'Valores', path: '/valores', icon: 'fa-euro-sign' },
    { label: 'Registos', path: '/registos', icon: 'fa-list-alt' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-100">
          <span className={`font-bold text-brand-600 transition-all ${isSidebarOpen ? 'text-xl' : 'text-xs'}`}>
            {isSidebarOpen ? 'Cedência de Espaços' : 'SCML'}
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${item.icon} w-6 text-center`}></i>
              {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-600"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-brand-600 flex items-center justify-between px-8 shadow-md z-10">
          <h1 className="text-xl font-bold text-white">
            {menuItems.find(m => m.path === location.pathname)?.label || 'Sistema'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user?.email}</p>
              <p className="text-[10px] text-brand-200 uppercase font-bold tracking-widest opacity-80">Administrador</p>
            </div>
            <div className="h-8 w-px bg-brand-500/50"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-700/50 text-brand-100 hover:bg-brand-800 hover:text-white transition-all text-sm font-semibold"
              title="Sair do sistema"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
