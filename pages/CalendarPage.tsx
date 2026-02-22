
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, Space, BookingStatus } from '../services/types';
import Modal from '../components/Modal';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for day details
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [bData, sData] = await Promise.all([
        api.getBookings(),
        api.getSpaces()
      ]);
      setBookings(bData);
      setSpaces(sData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

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

  const renderCalendar = () => {
    const cells = [];
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-slate-100 bg-slate-50/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today;
      const dayBooks = bookings.filter(b => b.start_date.split('T')[0] === dateStr);

      cells.push(
        <div 
          key={day} 
          onClick={() => {
            setSelectedDay(date);
            setDayBookings(dayBooks);
          }}
          className={`h-32 border-b border-r border-slate-100 p-2 cursor-pointer transition-all hover:bg-brand-50/30 group ${isToday ? 'bg-brand-50/10' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold ${isToday ? 'bg-brand-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-600'}`}>
              {day}
            </span>
          </div>
          
          <div className="space-y-1 overflow-hidden">
            {dayBooks.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-1.5 truncate">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(b.status)}`}></div>
                <span className="text-[10px] font-medium text-slate-700 truncate">{b.event_name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-[#16605b] p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-all"><i className="fas fa-chevron-left"></i></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-[#16605B] bg-white border border-white/20 rounded-lg hover:bg-slate-50 transition-all">Hoje</button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-all"><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center py-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">{loading ? <div className="col-span-7 h-96 flex items-center justify-center text-slate-300 italic">Sincronizando...</div> : renderCalendar()}</div>
      </div>

      <div className="flex items-center gap-6 justify-center py-4 bg-white rounded-xl border border-slate-100">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-600"></div><span className="text-[10px] font-bold uppercase text-slate-500">Confirmada</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-400"></div><span className="text-[10px] font-bold uppercase text-slate-500">Pendente</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-[10px] font-bold uppercase text-slate-500">Visita</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div><span className="text-[10px] font-bold uppercase text-slate-500">Aguarda Resposta</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-bold uppercase text-slate-500">Cancelada</span></div>
      </div>

      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} title={`Agenda ${selectedDay?.toLocaleDateString()}`}>
        <div className="space-y-3">
          {dayBookings.length > 0 ? dayBookings.map(book => (
            <div key={book.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-800">{book.event_name}</h4>
              <p className="text-xs text-slate-500 mt-1">{new Date(book.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} às {new Date(book.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(book.status)}`}></span>
                <span className="text-[10px] font-black uppercase text-slate-400">{book.status === BookingStatus.EXPIRED ? 'Aguarda Resposta' : book.status}</span>
              </div>
            </div>
          )) : <p className="text-center py-8 text-slate-400 italic">Sem eventos agendados.</p>}
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;
