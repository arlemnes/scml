
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { DashboardKPIs, Booking, Space, BookingStatus, Responsible } from '../services/types';

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State (Multi-select)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Calendar & Selected Day State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await api.checkBookingExpirations();
      const [kpiData, bData, sData, rData] = await Promise.all([
        api.getDashboardKPIs(),
        api.getBookings(),
        api.getSpaces(),
        api.getResponsibles()
      ]);
      setKpis(kpiData);
      setAllBookings(bData);
      setSpaces(sData);
      setResponsibles(rData);
      
      // Initialize with ALL spaces selected by default
      setSelectedSpaceIds(sData.map(s => s.id));
      
      setLoading(false);
    };
    loadData();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter bookings based on selected Space IDs
  const filteredBookings = useMemo(() => {
    return allBookings.filter(b => selectedSpaceIds.includes(b.space_id));
  }, [allBookings, selectedSpaceIds]);

  // Update dayBookings whenever the selected day or the filter changes
  useEffect(() => {
    const dateStr = selectedDay.toISOString().split('T')[0];
    const books = filteredBookings.filter(b => b.start_date.split('T')[0] === dateStr);
    setDayBookings(books);
  }, [selectedDay, filteredBookings]);

  // Toggle Logic
  const toggleSpace = (id: string) => {
    setSelectedSpaceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllSpaces = () => {
    if (selectedSpaceIds.length === spaces.length) {
      setSelectedSpaceIds([]); // Deselect all
    } else {
      setSelectedSpaceIds(spaces.map(s => s.id)); // Select all
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-brand-600';
      case BookingStatus.PENDING: return 'bg-brand-400';
      case BookingStatus.EXPIRED: return 'bg-teal-500';
      case BookingStatus.CANCELLED: return 'bg-red-500';
      case BookingStatus.VISIT: return 'bg-purple-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusTextClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'text-brand-600';
      case BookingStatus.PENDING: return 'text-amber-600';
      case BookingStatus.CANCELLED: return 'text-red-600';
      case BookingStatus.EXPIRED: return 'text-teal-600';
      case BookingStatus.VISIT: return 'text-purple-600';
      default: return 'text-slate-500';
    }
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(date);
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const renderCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const today = new Date().toISOString().split('T')[0];
    const selectedStr = selectedDay.toISOString().split('T')[0];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-slate-50/50 border-b border-r border-slate-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedStr;
      
      const dayBooks = filteredBookings.filter(b => b.start_date.split('T')[0] === dateStr);

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-20 sm:h-24 border-b border-r border-slate-100 p-2 cursor-pointer transition-all relative group 
            ${isSelected ? 'bg-brand-50/50 ring-1 ring-inset ring-brand-200 z-10' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold ${
              isToday 
                ? 'bg-brand-600 text-white w-5 h-5 flex items-center justify-center rounded-full' 
                : isSelected ? 'text-brand-700 font-black' : 'text-slate-400'
            }`}>
              {day}
            </span>
            {dayBooks.length > 0 && (
              <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-1 rounded">
                {dayBooks.length}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {dayBooks.slice(0, 4).map(b => (
              <div key={b.id} className={`w-1.5 h-1.5 rounded-full ${getStatusColor(b.status)}`} title={b.event_name}></div>
            ))}
            {dayBooks.length > 4 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
          </div>
        </div>
      );
    }
    return days;
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">Sincronizando Dados...</p>
    </div>
  );

  const statusStats = [
    { label: 'Confirmadas', value: kpis?.bookingsByStatus[BookingStatus.CONFIRMED], color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Pendentes', value: kpis?.bookingsByStatus[BookingStatus.PENDING], color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Visitas', value: kpis?.bookingsByStatus[BookingStatus.VISIT], color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Aguarda Resp.', value: kpis?.bookingsByStatus[BookingStatus.EXPIRED], color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Canceladas', value: kpis?.bookingsByStatus[BookingStatus.CANCELLED], color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const respList = Object.entries(kpis?.bookingsByResponsible || {}).map(([name, count]) => {
    const profile = responsibles.find(r => r.name === name);
    return { name, count: count as number, role: profile?.role || 'Staff' };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-all">
          <div className="bg-brand-600 p-4 rounded-xl text-white mr-4 shadow-lg shadow-brand-100 group-hover:scale-110 transition-transform"><i className="fas fa-users text-xl"></i></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Clientes</p><h3 className="text-2xl font-black text-slate-800">{kpis?.totalCustomers}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-all">
          <div className="bg-brand-600 p-4 rounded-xl text-white mr-4 shadow-lg shadow-brand-100 group-hover:scale-110 transition-transform"><i className="fas fa-building text-xl"></i></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Espaços</p><h3 className="text-2xl font-black text-slate-800">{kpis?.totalSpaces}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-all">
          <div className="bg-brand-600 p-4 rounded-xl text-white mr-4 shadow-lg shadow-brand-100 group-hover:scale-110 transition-transform"><i className="fas fa-calendar-check text-xl"></i></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Processos</p><h3 className="text-2xl font-black text-slate-800">{kpis?.totalBookings}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Summary */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
            <span className="w-6 h-px bg-slate-200 mr-2"></span> Resumo de Estados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statusStats.map((stat, idx) => (
              <div key={idx} className={`${stat.bg} p-4 rounded-2xl border border-transparent transition-all hover:border-slate-100 text-center`}>
                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-tighter">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Workload */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
            <span className="w-6 h-px bg-slate-200 mr-2"></span> Gestores Ativos
          </h3>
          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
            {respList.slice(0, 4).map((resp, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">{resp.name}</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-brand-600 font-black text-[9px]">{resp.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar and Daily Agenda Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Main Calendar */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
          {/* Calendar Header with filter */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-[#16605b] gap-4 z-20 relative">
            <div className="flex items-center gap-4 flex-1">
                <h2 className="text-lg font-black text-white flex items-center shrink-0">
                <i className="far fa-calendar-alt mr-3 opacity-90"></i>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                {/* Multi-Select Space Filter */}
                <div className="relative" ref={filterRef}>
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all focus:ring-2 focus:ring-white/30"
                  >
                    <i className="fas fa-filter text-[10px] opacity-70"></i>
                    {selectedSpaceIds.length === spaces.length ? 'Todos os Espaços' : `${selectedSpaceIds.length} Selecionados`}
                    <i className="fas fa-chevron-down text-[10px] ml-1 opacity-70"></i>
                  </button>

                  {/* Dropdown Menu */}
                  {isFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div 
                        onClick={toggleAllSpaces}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-brand-50 rounded-lg cursor-pointer transition-colors border-b border-slate-50 mb-1"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSpaceIds.length === spaces.length ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                          {selectedSpaceIds.length === spaces.length && <i className="fas fa-check text-white text-[10px]"></i>}
                        </div>
                        <span className="text-xs font-bold text-slate-700">Selecionar Todos</span>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                        {spaces.map(space => {
                          const isSelected = selectedSpaceIds.includes(space.id);
                          return (
                            <div 
                              key={space.id}
                              onClick={() => toggleSpace(space.id)}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                {isSelected && <i className="fas fa-check text-white text-[10px]"></i>}
                              </div>
                              <span className={`text-xs ${isSelected ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{space.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
            </div>

            <div className="flex gap-1 self-end sm:self-auto">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl text-white transition-all">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDay(now);
              }} className="px-3 py-1 text-[10px] font-black text-[#16605B] bg-white border border-white/20 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest">
                Hoje
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl text-white transition-all">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center py-2 bg-slate-100/30 border-b border-slate-100">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        {/* PERSISTENT DAILY AGENDA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px] xl:h-[584px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-brand-600 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Agenda do Dia</h2>
              <p className="text-lg font-black">
                {selectedDay.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
              </p>
            </div>
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-inner">
              <i className="fas fa-clock text-white"></i>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
            {dayBookings.length > 0 ? (
              dayBookings.sort((a,b) => a.start_date.localeCompare(b.start_date)).map(book => {
                const space = spaces.find(s => s.id === book.space_id);
                return (
                  <div key={book.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    {/* Status vertical bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(book.status)}`}></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-brand-600 transition-colors">{book.event_name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{space?.name || 'Espaço Indefinido'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pl-2">
                      <div className="flex items-center text-[11px] font-bold text-slate-600">
                        <i className="far fa-clock mr-2 opacity-40"></i>
                        {new Date(book.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`text-[9px] font-black uppercase text-right self-center ${getStatusTextClass(book.status)}`}>
                         {book.status === BookingStatus.EXPIRED ? 'AGUARDA RESPOSTA' : book.status}
                      </div>
                    </div>

                    <div className="flex items-center text-[11px] font-bold text-slate-600 mt-1 pl-2">
                       <i className="fas fa-users mr-2 opacity-40"></i>
                       {book.attendees || 0} pax
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-50 pl-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-black">
                          {book.responsible.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{book.responsible}</span>
                      </div>
                      <button 
                        onClick={() => window.location.hash = '#/processos'}
                        className="text-[9px] font-black text-brand-600 hover:underline uppercase tracking-widest"
                      >
                        Gerir
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <i className="far fa-calendar-times text-slate-300 text-2xl"></i>
                </div>
                <p className="text-slate-400 font-bold text-sm">Sem eventos</p>
                {selectedSpaceIds.length === 0 ? (
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Selecione um espaço</p>
                ) : (
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Para esta data</p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 text-center">
            <button 
              onClick={() => window.location.hash = '#/processos'}
              className="w-full py-3 bg-slate-50 hover:bg-brand-50 text-slate-500 hover:text-brand-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-slate-100 hover:border-brand-200"
            >
              Criar Novo Processo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
