import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, Customer, Space, BookingStatus, Responsible } from '../services/types';
import Modal from '../components/Modal';

const Visits: React.FC = () => {
  const [visits, setVisits] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<Partial<Booking> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    await api.checkBookingExpirations();
    const [bData, cData, sData, rData] = await Promise.all([
      api.getBookings(),
      api.getCustomers(),
      api.getSpaces(),
      api.getResponsibles()
    ]);
    setVisits(bData.filter(b => b.status === BookingStatus.VISIT));
    setCustomers(cData);
    setSpaces(sData);
    setResponsibles(rData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenModal = (visit?: Booking) => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(today.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setCurrentVisit(visit || { 
      space_id: '', 
      customer_id: '', 
      start_date: start.toISOString().slice(0, 16), 
      end_date: end.toISOString().slice(0, 16), 
      responsible: '',
      event_name: 'Visita Técnica',
      status: BookingStatus.VISIT,
      price: 0,
      attendees: 1
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVisit) return;
    setSaveLoading(true);
    try {
      const payload = { ...currentVisit, status: BookingStatus.VISIT };
      if (currentVisit.id) {
        await api.updateBooking(currentVisit.id, payload);
      } else {
        await api.createBooking(payload as any);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      alert('Erro ao salvar visita');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar esta visita?')) return;
    await api.deleteBooking(id);
    loadAll();
  };

  const filteredVisits = visits.filter(v => 
    v.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers.find(c => c.id === v.customer_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de Visitas</h2>
          <p className="text-sm text-slate-500">Agendamento de visitas técnicas e comerciais aos espaços.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#56EBCB] hover:brightness-95 text-brand-900 px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-teal-100 flex items-center"
        >
          <i className="fas fa-eye mr-2"></i> Nova Visita
        </button>
      </div>

       <div className="relative max-w-md">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text"
          placeholder="Buscar visita por nome ou cliente..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Visitante / Cliente</th>
                <th className="px-6 py-4">Espaço</th>
                <th className="px-6 py-4">Acompanhante (Staff)</th>
                <th className="px-6 py-4 text-center">Visitantes</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">Carregando visitas...</td></tr>
              ) : filteredVisits.length > 0 ? filteredVisits.map(visit => {
                const customer = customers.find(c => c.id === visit.customer_id);
                const space = spaces.find(s => s.id === visit.space_id);
                const date = new Date(visit.start_date);
                
                return (
                  <tr key={visit.id} className="hover:bg-purple-50/30 transition-colors">
                     <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{date.toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{visit.event_name}</p>
                      <p className="text-xs text-purple-600 font-semibold uppercase">{customer?.name || 'Cliente Prospect'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600">{space?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                        {visit.responsible}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-600">{visit.attendees}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenModal(visit)}
                        className="p-2 text-slate-400 hover:text-purple-600 transition-all"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(visit.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma visita agendada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={currentVisit?.id ? 'Editar Visita' : 'Agendar Visita'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Motivo / Nome</label>
            <input 
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all font-semibold"
              placeholder="Ex: Visita Técnica Comercial"
              value={currentVisit?.event_name || ''}
              onChange={e => setCurrentVisit(prev => ({ ...prev!, event_name: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente / Prospect</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.customer_id || ''}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, customer_id: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gestor SCML</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.responsible || ''}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, responsible: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {responsibles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Espaço de Interesse</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.space_id || ''}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, space_id: e.target.value }))}
              >
                <option value="">Qual espaço?</option>
                {spaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Visitantes</label>
              <input 
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.attendees || 1}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, attendees: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data/Hora Início</label>
              <input 
                required
                type="datetime-local"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.start_date ? new Date(currentVisit.start_date).toISOString().slice(0, 16) : ''}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data/Hora Fim</label>
              <input 
                required
                type="datetime-local"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={currentVisit?.end_date ? new Date(currentVisit.end_date).toISOString().slice(0, 16) : ''}
                onChange={e => setCurrentVisit(prev => ({ ...prev!, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)} 
              className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saveLoading}
              className="px-8 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {saveLoading ? 'Agendando...' : 'Agendar Visita'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Visits;