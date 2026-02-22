import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, Customer, Space, BookingStatus, Responsible, BookingType, ApprovalStatus } from '../services/types';
import Modal from '../components/Modal';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Partial<Booking> | null>(null);
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
    
    // Sort by createdAt descending (Newest first)
    const sortedBookings = bData.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    setBookings(sortedBookings);
    setCustomers(cData);
    setSpaces(sData);
    setResponsibles(rData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenModal = (book?: Booking) => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(today.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    setCurrentBook(book || { 
      space_id: '', 
      customer_id: '', 
      start_date: start.toISOString().slice(0, 16), 
      end_date: end.toISOString().slice(0, 16), 
      setup_date: '',
      breakdown_date: '',
      responsible: '',
      event_name: '',
      description: '',
      situation_notes: '',
      status: BookingStatus.PENDING,
      type: BookingType.PAID,
      approval_status: ApprovalStatus.PENDING, // Default approval status set to '------------'
      contact_name: '',
      contact_email: '',
      price: 0,
      attendees: 0,
      createdAt: new Date().toISOString()
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook) return;
    setSaveLoading(true);
    try {
      if (currentBook.id) {
        await api.updateBooking(currentBook.id, currentBook);
      } else {
        await api.createBooking(currentBook as any);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      alert('Erro ao salvar processo');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este processo definitivamente?')) return;
    await api.deleteBooking(id);
    loadAll();
  };

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
    if (status === BookingStatus.VISIT) return 'Pedido de Informação';
    if (status === BookingStatus.EXPIRED) return 'Aguarda Resposta';
    return status;
  };

  const getApprovalBadgeClass = (status?: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.AUTHORIZED: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case ApprovalStatus.FREE_CESSION: return 'text-blue-600 bg-blue-50 border-blue-100';
      case ApprovalStatus.NOT_AUTHORIZED: return 'text-rose-600 bg-rose-50 border-rose-100';
      case ApprovalStatus.DM: return 'text-slate-600 bg-slate-100 border-slate-200';
      case ApprovalStatus.PENDING: return 'text-slate-400 bg-slate-50 border-slate-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const getApprovalLabel = (status?: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.AUTHORIZED: return 'Autorizado';
      case ApprovalStatus.FREE_CESSION: return 'Cedência Gratuita';
      case ApprovalStatus.NOT_AUTHORIZED: return 'Não Autorizado';
      case ApprovalStatus.DM: return 'DM';
      case ApprovalStatus.PENDING: return '------------';
      default: return '------------';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  // Helper to get contacts of selected customer
  const getSelectedCustomerContacts = () => {
      if (!currentBook?.customer_id) return [];
      const customer = customers.find(c => c.id === currentBook.customer_id);
      return customer?.contacts || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cronograma de Eventos</h2>
          <p className="text-sm text-slate-500">Cada evento possui um gestor interno (Responsável) e um cliente associado.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-brand-100"
        >
          <i className="fas fa-calendar-plus mr-2"></i> Novo Processo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Data Pedido</th>
                <th className="px-6 py-4">Evento / Empresa Cliente</th>
                <th className="px-6 py-4">Gestor Interno</th>
                <th className="px-6 py-4">Espaço</th>
                <th className="px-6 py-4 text-center">Pax</th>
                <th className="px-6 py-4 text-center">Aprovação</th>
                <th className="px-6 py-4 text-right">Valor / Cedência</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 animate-pulse">Carregando processos...</td></tr>
              ) : bookings.length > 0 ? bookings.map(book => {
                const customer = customers.find(c => c.id === book.customer_id);
                const space = spaces.find(s => s.id === book.space_id);
                return (
                  <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-400">#{book.id}</span>
                    </td>
                    <td className="px-6 py-4">
                        {book.createdAt ? (
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-600">{new Date(book.createdAt).toLocaleDateString('pt-PT')}</span>
                                <span className="text-[10px] text-slate-400">{new Date(book.createdAt).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-300">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{book.event_name}</p>
                      {book.description && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{book.description}</p>}
                      <p className="text-xs text-brand-600 font-semibold uppercase mt-0.5">{customer?.name || 'Cliente Geral'}</p>
                      {book.contact_name && <p className="text-[10px] text-slate-500 mt-1"><i className="far fa-user mr-1"></i>{book.contact_name}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{book.responsible}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{space?.name || '???'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-600">{book.attendees || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wide ${getApprovalBadgeClass(book.approval_status)}`}>
                        {getApprovalLabel(book.approval_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-mono font-bold text-slate-600">
                        {book.type === BookingType.FREE ? '0,00 €' : formatCurrency(book.price)}
                      </p>
                      {book.type === BookingType.FREE && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-50 text-[9px] font-bold text-brand-700 uppercase tracking-wide border border-brand-100">
                            Gratuita
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(book.status)}`}>
                        {getStatusLabel(book.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenModal(book)}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-all"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(book.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">Nenhum processo registado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={currentBook?.id ? 'Editar Processo' : 'Novo Processo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/4">
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">ID</label>
               <input 
                 disabled
                 className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono font-bold text-center"
                 value={currentBook?.id ? `#${currentBook.id}` : 'AUTO'}
               />
            </div>
             <div className="w-full sm:w-1/4">
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Data Pedido</label>
               <input 
                 type="datetime-local"
                 className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-600"
                 value={currentBook?.createdAt ? new Date(currentBook.createdAt).toISOString().slice(0, 16) : ''}
                 onChange={e => setCurrentBook(prev => ({ ...prev!, createdAt: e.target.value }))}
               />
            </div>
            <div className="w-full sm:w-2/4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Nome do Evento</label>
              <input 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-semibold"
                placeholder="Ex: Workshop de Design"
                value={currentBook?.event_name || ''}
                onChange={e => setCurrentBook(prev => ({ ...prev!, event_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Descrição / Notas</label>
             <textarea 
               rows={2}
               className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-600 resize-none"
               placeholder="Detalhes adicionais sobre o evento..."
               value={currentBook?.description || ''}
               onChange={e => setCurrentBook(prev => ({ ...prev!, description: e.target.value }))}
             />
          </div>

          {/* New Field: Ponto de Situação */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Ponto de Situação / Observações</label>
             <textarea 
               rows={2}
               className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium text-slate-600 resize-none bg-amber-50/30"
               placeholder="Registos internos sobre o estado do processo..."
               value={currentBook?.situation_notes || ''}
               onChange={e => setCurrentBook(prev => ({ ...prev!, situation_notes: e.target.value }))}
             />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente / Entidade</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentBook?.customer_id || ''}
                onChange={e => setCurrentBook(prev => ({ ...prev!, customer_id: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interlocutor</label>
               <select 
                  className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${!currentBook?.customer_id ? 'bg-slate-50 text-slate-400' : ''}`}
                  disabled={!currentBook?.customer_id}
                  value={getSelectedCustomerContacts().find(c => c.email === currentBook?.contact_email)?.id || ''}
                  onChange={e => {
                      const contactId = e.target.value;
                      const contact = getSelectedCustomerContacts().find(c => c.id === contactId);
                      if (contact) {
                          setCurrentBook(prev => ({
                              ...prev!,
                              contact_name: contact.name,
                              contact_email: contact.email
                          }));
                      }
                  }}
               >
                 <option value="">Selecione...</option>
                 {getSelectedCustomerContacts().map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gestor Responsável</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentBook?.responsible || ''}
                onChange={e => setCurrentBook(prev => ({ ...prev!, responsible: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {responsibles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Detalhes do Contacto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
                <input 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="Nome de quem faz o pedido"
                  value={currentBook?.contact_name || ''}
                  onChange={e => setCurrentBook(prev => ({ ...prev!, contact_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  placeholder="email@contacto.com"
                  value={currentBook?.contact_email || ''}
                  onChange={e => setCurrentBook(prev => ({ ...prev!, contact_email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Logistics & Schedule Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Logística & Horários</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Setup */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-[10px] tracking-wide">Data Montagem</label>
                  <input 
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                    value={currentBook?.setup_date ? new Date(currentBook.setup_date).toISOString().slice(0, 16) : ''}
                    onChange={e => setCurrentBook(prev => ({ ...prev!, setup_date: e.target.value }))}
                  />
                </div>
                {/* Breakdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-[10px] tracking-wide">Data Desmontagem</label>
                  <input 
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                    value={currentBook?.breakdown_date ? new Date(currentBook.breakdown_date).toISOString().slice(0, 16) : ''}
                    onChange={e => setCurrentBook(prev => ({ ...prev!, breakdown_date: e.target.value }))}
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
               <div>
                  <label className="block text-xs font-black text-brand-700 uppercase mb-1">Início Evento</label>
                  <input 
                    required
                    type="datetime-local"
                    className="w-full px-3 py-2 border-2 border-brand-100 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-700"
                    value={currentBook?.start_date ? new Date(currentBook.start_date).toISOString().slice(0, 16) : ''}
                    onChange={e => setCurrentBook(prev => ({ ...prev!, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-brand-700 uppercase mb-1">Fim Evento</label>
                  <input 
                    required
                    type="datetime-local"
                    className="w-full px-3 py-2 border-2 border-brand-100 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-700"
                    value={currentBook?.end_date ? new Date(currentBook.end_date).toISOString().slice(0, 16) : ''}
                    onChange={e => setCurrentBook(prev => ({ ...prev!, end_date: e.target.value }))}
                  />
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Espaço</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentBook?.space_id || ''}
                onChange={e => setCurrentBook(prev => ({ ...prev!, space_id: e.target.value }))}
              >
                <option value="">Onde será?</option>
                {spaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

             <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Visitantes</label>
              <input 
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentBook?.attendees || 0}
                onChange={e => setCurrentBook(prev => ({ ...prev!, attendees: parseInt(e.target.value) }))}
              />
            </div>

             <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Cedência</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-semibold text-slate-700"
                value={currentBook?.type || BookingType.PAID}
                onChange={e => {
                    const newType = e.target.value as BookingType;
                    setCurrentBook(prev => ({ 
                        ...prev!, 
                        type: newType,
                        price: newType === BookingType.FREE ? 0 : prev?.price 
                    }))
                }}
              >
                <option value={BookingType.PAID}>Paga</option>
                <option value={BookingType.FREE}>Gratuita</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (€)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                disabled={currentBook?.type === BookingType.FREE}
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${currentBook?.type === BookingType.FREE ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                value={currentBook?.price || 0}
                onChange={e => setCurrentBook(prev => ({ ...prev!, price: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado / Status</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-brand-700"
                value={currentBook?.status || BookingStatus.PENDING}
                onChange={e => setCurrentBook(prev => ({ ...prev!, status: e.target.value as BookingStatus }))}
              >
                <option value={BookingStatus.PENDING}>Pendente</option>
                <option value={BookingStatus.CONFIRMED}>Confirmada</option>
                <option value={BookingStatus.EXPIRED}>Aguarda Resposta</option>
                <option value={BookingStatus.CANCELLED}>Cancelada</option>
                <option value={BookingStatus.VISIT}>Pedido de Informação</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aprovação Interna</label>
              <select 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-700"
                value={currentBook?.approval_status || ApprovalStatus.PENDING}
                onChange={e => setCurrentBook(prev => ({ ...prev!, approval_status: e.target.value as ApprovalStatus }))}
              >
                <option value={ApprovalStatus.PENDING}>------------</option>
                <option value={ApprovalStatus.DM}>DM</option>
                <option value={ApprovalStatus.AUTHORIZED}>Autorizado</option>
                <option value={ApprovalStatus.FREE_CESSION}>Cedência Gratuita</option>
                <option value={ApprovalStatus.NOT_AUTHORIZED}>Não Autorizado</option>
              </select>
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
              className="px-8 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {saveLoading ? 'Confirmar' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;