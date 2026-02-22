
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Responsible } from '../services/types';
import Modal from '../components/Modal';

const Responsibles: React.FC = () => {
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentResp, setCurrentResp] = useState<Partial<Responsible> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const rData = await api.getResponsibles();
    setResponsibles(rData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (resp?: Responsible) => {
    setCurrentResp(resp || { name: '', email: '', phone: '', role: '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResp) return;
    setSaveLoading(true);
    try {
      if (currentResp.id) {
        await api.updateResponsible(currentResp.id, currentResp);
      } else {
        await api.createResponsible(currentResp as any);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert('Erro ao salvar gestor');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este gestor da equipa?')) return;
    await api.deleteResponsible(id);
    loadData();
  };

  const filtered = responsibles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestores</h2>
          <p className="text-sm text-slate-500">Gira os gestores internos pela organização dos eventos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center shadow-lg shadow-brand-100"
        >
          <i className="fas fa-user-shield mr-2"></i> Novo Gestor
        </button>
      </div>

      <div className="relative max-w-md">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text"
          placeholder="Buscar gestor ou cargo..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome do Gestor</th>
                <th className="px-6 py-4">Cargo / Função Interna</th>
                <th className="px-6 py-4">Contactos Diretos</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center">
                  <i className="fas fa-circle-notch fa-spin text-brand-600 text-2xl mb-2"></i>
                  <p className="text-slate-400 text-sm">Sincronizando equipa...</p>
                </td></tr>
              ) : filtered.length > 0 ? filtered.map(resp => (
                <tr key={resp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold">
                        {resp.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{resp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase">
                      {resp.role || 'Geral'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 flex items-center mb-1">
                      <i className="far fa-envelope w-4"></i> {resp.email}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center">
                      <i className="fas fa-phone w-4"></i> {resp.phone}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button 
                      onClick={() => handleOpenModal(resp)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(resp.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  Nenhum gestor registado.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={currentResp?.id ? 'Editar Gestor' : 'Adicionar Gestor'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
              <input 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Ex: Carlos Silva"
                value={currentResp?.name || ''}
                onChange={e => setCurrentResp(prev => ({ ...prev!, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cargo / Função</label>
              <input 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Ex: Gestor de Eventos"
                value={currentResp?.role || ''}
                onChange={e => setCurrentResp(prev => ({ ...prev!, role: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail Institucional</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Ex: staff@scml.pt"
                value={currentResp?.email || ''}
                onChange={e => setCurrentResp(prev => ({ ...prev!, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Extensão / Telemóvel</label>
              <input 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Ex: 912 000 000"
                value={currentResp?.phone || ''}
                onChange={e => setCurrentResp(prev => ({ ...prev!, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={saveLoading}
              className="px-8 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 disabled:opacity-50 transition-all"
            >
              {saveLoading ? 'Sincronizando...' : 'Guardar Gestor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Responsibles;
