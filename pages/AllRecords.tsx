
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, Customer, Space, BookingStatus } from '../services/types';

const AllRecords: React.FC = () => {
  const [records, setRecords] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'processo', 'visita'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' or BookingStatus
  const [filterSpace, setFilterSpace] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [bData, cData, sData] = await Promise.all([
        api.getBookings(),
        api.getCustomers(),
        api.getSpaces()
      ]);
      
      // Sort by createdAt descending (newest registration first)
      const sortedRecords = bData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setRecords(sortedRecords);
      setCustomers(cData);
      setSpaces(sData);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-brand-100 text-brand-700';
      case BookingStatus.PENDING: return 'bg-amber-100 text-amber-700';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-700';
      case BookingStatus.EXPIRED: return 'bg-teal-100 text-teal-700';
      case BookingStatus.VISIT: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'Confirmada';
      case BookingStatus.PENDING: return 'Pendente';
      case BookingStatus.CANCELLED: return 'Cancelada';
      case BookingStatus.EXPIRED: return 'Aguarda Resposta';
      case BookingStatus.VISIT: return 'Visita';
      default: return status;
    }
  };

  const getTypeIcon = (status: BookingStatus) => {
    if (status === BookingStatus.VISIT) {
      return <i className="fas fa-eye text-purple-500" title="Visita"></i>;
    }
    return <i className="fas fa-calendar-check text-brand-500" title="Processo"></i>;
  };

  const getTypeText = (status: BookingStatus) => {
    return status === BookingStatus.VISIT ? 'Visita' : 'Processo';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterSpace('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredRecords = records.filter(r => {
    // 1. Text Search
    const customerName = customers.find(c => c.id === r.customer_id)?.name || '';
    const searchString = (r.event_name + ' ' + customerName + ' ' + r.responsible).toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // 2. Type Filter
    const isVisit = r.status === BookingStatus.VISIT;
    const matchesType = 
      filterType === 'all' ? true :
      filterType === 'visita' ? isVisit :
      !isVisit; // 'processo'

    // 3. Status Filter
    const matchesStatus = 
      filterStatus === 'all' ? true :
      r.status === filterStatus;

    // 4. Space Filter
    const matchesSpace = 
      filterSpace === 'all' ? true :
      r.space_id === filterSpace;

    // 5. Date Range Filter (Using Event Start Date)
    const eventDate = new Date(r.start_date);
    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && eventDate >= new Date(filterStartDate);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day
      matchesDate = matchesDate && eventDate <= end;
    }

    return matchesSearch && matchesType && matchesStatus && matchesSpace && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Histórico Completo</h2>
          <p className="text-sm text-slate-500">Listagem geral de todos os processos e visitas ordenados por data de registo.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pesquisar</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text"
                placeholder="Evento, Cliente, Staff..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Registo</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos os Tipos</option>
              <option value="processo">Apenas Processos</option>
              <option value="visita">Apenas Visitas</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Estados</option>
              <option value={BookingStatus.PENDING}>Pendente</option>
              <option value={BookingStatus.CONFIRMED}>Confirmada</option>
              <option value={BookingStatus.VISIT}>Visita</option>
              <option value={BookingStatus.EXPIRED}>Aguarda Resposta</option>
              <option value={BookingStatus.CANCELLED}>Cancelada</option>
            </select>
          </div>

          {/* Space Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Espaço</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
              value={filterSpace}
              onChange={(e) => setFilterSpace(e.target.value)}
            >
              <option value="all">Todos os Espaços</option>
              {spaces.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
           <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Evento (Início)</label>
            <input 
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-600"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Evento (Fim)</label>
            <input 
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-600"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-filter-circle-xmark"></i> Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Data Registo</th>
                <th className="px-6 py-4">Data Evento</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Espaço</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 animate-pulse">Carregando registos...</td></tr>
              ) : filteredRecords.length > 0 ? filteredRecords.map(record => {
                const customer = customers.find(c => c.id === record.customer_id);
                const space = spaces.find(s => s.id === record.space_id);
                const startDate = new Date(record.start_date);
                const createdAt = record.createdAt ? new Date(record.createdAt) : new Date(record.start_date);

                return (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{createdAt.toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-600">{startDate.toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(record.status)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {getTypeText(record.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">{record.event_name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {space?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {record.responsible}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registo encontrado com os filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllRecords;
