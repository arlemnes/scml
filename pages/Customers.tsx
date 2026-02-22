
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Customer, EntityStatus, ContactPerson, Attachment } from '../services/types';
import Modal from '../components/Modal';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await api.getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenModal = (cust?: Customer) => {
    if (cust) {
        // Migration logic for legacy data: if contacts array is empty but legacy fields exist, auto-populate.
        let contacts = cust.contacts || [];
        if (contacts.length === 0 && cust.company) {
            contacts = [{
                id: Math.random().toString(36).substr(2, 9),
                name: cust.company,
                rgpd_consent: true,
                email: '',
                phone: cust.phone || ''
            }];
        }
        setCurrentCustomer({ ...cust, contacts, attachments: cust.attachments || [] });
    } else {
        // New Customer
        setCurrentCustomer({ 
            name: '', 
            email: '', 
            contacts: [], 
            attachments: [],
            status: EntityStatus.ACTIVE, 
            notes: '' 
        });
    }
    setModalOpen(true);
  };

  const handleAddContact = () => {
      if (!currentCustomer) return;
      const newContact: ContactPerson = {
          id: Math.random().toString(36).substr(2, 9),
          name: '',
          rgpd_consent: false,
          email: '',
          phone: ''
      };
      setCurrentCustomer(prev => ({
          ...prev!,
          contacts: [...(prev?.contacts || []), newContact]
      }));
  };

  const handleUpdateContact = (id: string, field: keyof ContactPerson, value: any) => {
      setCurrentCustomer(prev => ({
          ...prev!,
          contacts: (prev?.contacts || []).map(c => c.id === id ? { ...c, [field]: value } : c)
      }));
  };

  const handleRemoveContact = (id: string) => {
      setCurrentCustomer(prev => ({
          ...prev!,
          contacts: (prev?.contacts || []).filter(c => c.id !== id)
      }));
  };

  // --- Attachments Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && currentCustomer) {
        const file = e.target.files[0];
        
        const newAttachment: Attachment = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        };

        setCurrentCustomer(prev => ({
            ...prev!,
            attachments: [...(prev?.attachments || []), newAttachment]
        }));
    }
  };

  const handleRemoveAttachment = (id: string) => {
    if (currentCustomer) {
        setCurrentCustomer(prev => ({
            ...prev!,
            attachments: (prev?.attachments || []).filter(a => a.id !== id)
        }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  // -------------------------

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setSaveLoading(true);
    try {
      if (currentCustomer.id) {
        await api.updateCustomer(currentCustomer.id, currentCustomer);
      } else {
        await api.createCustomer(currentCustomer as any);
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      alert('Erro ao salvar cliente');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    await api.deleteCustomer(id);
    loadCustomers();
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contacts && c.contacts.some(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    // Legacy support
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text"
            placeholder="Buscar por empresa, interlocutor ou e-mail..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <i className="fas fa-plus mr-2"></i> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Empresa / Entidade</th>
                <th className="px-6 py-3">Interlocutores</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse">Carregando...</td></tr>
              ) : filtered.length > 0 ? filtered.map(customer => {
                  // Determine display contact (Legacy or First in Array)
                  const contacts = customer.contacts || [];
                  const firstContact = contacts.length > 0 ? contacts[0] : null;
                  const displayName = firstContact ? firstContact.name : (customer.company || '-');
                  const displayPhone = firstContact ? firstContact.phone : (customer.phone || '');

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-xs text-slate-700">{displayName}</p>
                                  {firstContact && (
                                    <span className={`text-[9px] px-1 rounded font-bold uppercase ${firstContact.rgpd_consent ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                                      {firstContact.rgpd_consent ? 'RGPD' : 'Sem RGPD'}
                                    </span>
                                  )}
                                </div>
                                {displayPhone && <p className="text-[10px] text-slate-400 font-mono">{displayPhone}</p>}
                            </div>
                            {contacts.length > 1 && (
                                <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded" title={`${contacts.length - 1} outros interlocutores`}>
                                    +{contacts.length - 1}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        customer.status === EntityStatus.ACTIVE ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {customer.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button 
                        onClick={() => handleOpenModal(customer)}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Editar"
                        >
                        <i className="fas fa-edit"></i>
                        </button>
                        <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                        >
                        <i className="fas fa-trash"></i>
                        </button>
                    </td>
                    </tr>
                );
              }) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={currentCustomer?.id ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Dados Gerais */}
          <div className="space-y-4">
              <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest border-b border-slate-100 pb-2">Dados da Entidade</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Empresa / Entidade</label>
                    <input 
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                        placeholder="Ex: Santa Casa da Misericórdia"
                        value={currentCustomer?.name || ''}
                        onChange={e => setCurrentCustomer(prev => ({ ...prev!, name: e.target.value }))}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">E-mail Geral</label>
                    <input 
                        required
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                        placeholder="Ex: geral@entidade.pt"
                        value={currentCustomer?.email || ''}
                        onChange={e => setCurrentCustomer(prev => ({ ...prev!, email: e.target.value }))}
                    />
                </div>
              </div>
          </div>
          
          {/* Interlocutores */}
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest">Interlocutores</h4>
                <button type="button" onClick={handleAddContact} className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded hover:bg-brand-100 transition-colors">
                    <i className="fas fa-plus mr-1"></i> Adicionar
                </button>
             </div>
             
             {currentCustomer?.contacts && currentCustomer.contacts.length > 0 ? (
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                     {currentCustomer.contacts.map((contact, index) => (
                         <div key={contact.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative group">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                <input 
                                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-brand-500"
                                    placeholder="Nome do Interlocutor"
                                    value={contact.name}
                                    onChange={e => handleUpdateContact(contact.id, 'name', e.target.value)}
                                />
                                <select
                                    className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-brand-500 font-semibold ${contact.rgpd_consent ? 'text-green-700 bg-green-50 border-green-200' : 'text-slate-500'}`}
                                    value={contact.rgpd_consent ? 'true' : 'false'}
                                    onChange={e => handleUpdateContact(contact.id, 'rgpd_consent', e.target.value === 'true')}
                                >
                                    <option value="false">RGPD: Não</option>
                                    <option value="true">RGPD: Sim</option>
                                </select>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input 
                                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-brand-500"
                                    placeholder="Email direto"
                                    value={contact.email}
                                    onChange={e => handleUpdateContact(contact.id, 'email', e.target.value)}
                                />
                                <input 
                                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-brand-500"
                                    placeholder="Telefone / Tlm"
                                    value={contact.phone}
                                    onChange={e => handleUpdateContact(contact.id, 'phone', e.target.value)}
                                />
                             </div>
                             <button 
                                type="button"
                                onClick={() => handleRemoveContact(contact.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover interlocutor"
                             >
                                 <i className="fas fa-times text-xs"></i>
                             </button>
                         </div>
                     ))}
                 </div>
             ) : (
                 <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                     Nenhum interlocutor associado. Adicione pelo menos um interlocutor.
                 </p>
             )}
          </div>

          {/* Attachments Section (Moved from Bookings) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest">Anexos & Documentação</h4>
                <label className="cursor-pointer bg-white border border-slate-200 hover:border-brand-400 text-slate-500 hover:text-brand-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm flex items-center gap-2">
                    <i className="fas fa-paperclip"></i> Adicionar
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
             </div>
             
             {currentCustomer?.attachments && currentCustomer.attachments.length > 0 ? (
                 <div className="space-y-2">
                     {currentCustomer.attachments.map(att => (
                         <div key={att.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 group">
                             <div className="flex items-center gap-3 overflow-hidden">
                                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                     <i className={`fas ${att.type.includes('pdf') ? 'fa-file-pdf text-red-400' : att.type.includes('image') ? 'fa-file-image text-brand-400' : 'fa-file-alt'}`}></i>
                                 </div>
                                 <div className="min-w-0">
                                     <p className="text-xs font-bold text-slate-700 truncate">{att.name}</p>
                                     <p className="text-[10px] text-slate-400">{formatFileSize(att.size)} • {new Date(att.uploadedAt).toLocaleDateString()}</p>
                                 </div>
                             </div>
                             <button 
                                type="button" 
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             >
                                 <i className="fas fa-trash-alt"></i>
                             </button>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                     <i className="fas fa-folder-open text-slate-300 text-2xl mb-2"></i>
                     <p className="text-xs text-slate-400 font-medium">Pasta vazia. Adicione NIF, certidões ou contratos.</p>
                 </div>
             )}
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas e Observações Internas</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
              placeholder="Histórico de pagamentos, preferências de catering, etc."
              value={currentCustomer?.notes || ''}
              onChange={e => setCurrentCustomer(prev => ({ ...prev!, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {saveLoading ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
