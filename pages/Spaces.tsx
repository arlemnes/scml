
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Space } from '../services/types';
import Modal from '../components/Modal';

// --- Sub-componente para o Card do Espaço com Galeria ---
const SpaceCard: React.FC<{
  space: Space;
  onEdit: (s: Space) => void;
  onDelete: (id: string) => void
}> = ({ space, onEdit, onDelete }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = Array.isArray(space.images) && space.images.length > 0 ? space.images : ['https://placehold.co/800x400?text=Sem+Foto'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
      <div className="h-48 overflow-hidden relative bg-slate-100 group">
        <img
          src={images[currentImgIndex]}
          alt={`${space.name} - Imagem ${currentImgIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Erro+na+Imagem';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* Status Badge */}
        <span className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm z-10 ${space.active ? 'bg-white/90 text-brand-700 backdrop-blur-sm' : 'bg-red-500 text-white'
          }`}>
          {space.active ? 'Disponível' : 'Manutenção'}
        </span>

        {/* Gallery Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/80 text-white hover:text-brand-900 flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/80 text-white hover:text-brand-900 flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full shadow-sm ${idx === currentImgIndex ? 'bg-white' : 'bg-white/40'}`}
                ></div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{space.name}</h3>
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-xs font-bold text-slate-500 flex items-center leading-relaxed">
              <i className="fas fa-map-marker-alt mr-1.5 text-brand-500 mt-0.5"></i>
              {space.address || 'Sem morada definida'}
            </p>
            {space.googleMapLink && (
              <a
                href={space.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[9px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded border border-brand-200 transition-colors uppercase tracking-wide flex items-center gap-1"
                title="Abrir no Google Maps"
              >
                <i className="fas fa-external-link-alt"></i> Mapa
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Lotação</p>
            <p className="text-sm font-bold text-slate-700">{space.capacity} <span className="text-[10px] font-normal text-slate-400">pax</span></p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Recursos</p>
            <p className="text-[10px] font-bold text-slate-700 truncate" title={space.extras}>{space.extras || '-'}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed">
          {space.description}
        </p>

        <div className="mt-auto flex gap-2 border-t border-slate-50 pt-4">
          <button
            onClick={() => onEdit(space)}
            className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all font-bold text-xs uppercase tracking-wider"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(space.id)}
            className="px-3 rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

const Spaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<Partial<Space> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Estado para o input de nova imagem no modal
  const [newImageUrl, setNewImageUrl] = useState('');

  const loadSpaces = async () => {
    setLoading(true);
    const data = await api.getSpaces();
    setSpaces(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  const handleOpenModal = (space?: Space) => {
    setCurrentSpace(space || {
      name: '',
      address: '',
      googleMapLink: '',
      capacity: 1,
      extras: '',
      images: [],
      description: '',
      active: true
    });
    setNewImageUrl('');
    setModalOpen(true);
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && currentSpace) {
      setCurrentSpace(prev => ({
        ...prev,
        images: [...(prev?.images || []), newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (currentSpace) {
      setCurrentSpace(prev => ({
        ...prev,
        images: (prev?.images || []).filter((_, idx) => idx !== indexToRemove)
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;
    setSaveLoading(true);

    // Auto-add the image URL if the user pasted it but forgot to click "Adicionar"
    let finalSpace = { ...currentSpace };
    if (newImageUrl.trim() !== '') {
      finalSpace.images = [...(finalSpace.images || []), newImageUrl.trim()];
      setNewImageUrl('');
    }

    try {
      if (finalSpace.id) {
        await api.updateSpace(finalSpace.id, finalSpace);
      } else {
        await api.createSpace(finalSpace as any);
      }
      setModalOpen(false);
      loadSpaces();
    } catch (err) {
      alert('Erro ao salvar espaço');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este espaço?')) return;
    await api.deleteSpace(id);
    loadSpaces();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de Espaços</h2>
          <p className="text-slate-500 text-sm">Gerencie as salas e auditórios disponíveis.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-brand-100"
        >
          <i className="fas fa-plus mr-2"></i> Novo Espaço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {loading ? (
          <div className="col-span-full text-center py-20 animate-pulse text-slate-400">
            <i className="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
            <p>Carregando espaços...</p>
          </div>
        ) : spaces.length > 0 ? (
          spaces.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl">
              <i className="fas fa-search"></i>
            </div>
            <p className="text-slate-500 font-medium">Nenhum espaço encontrado.</p>
            <p className="text-xs text-slate-400 mt-1">Adicione um novo espaço para começar.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={currentSpace?.id ? 'Editar Espaço' : 'Novo Espaço'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Espaço</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Ex: Sala VIP 01"
              value={currentSpace?.name || ''}
              onChange={e => setCurrentSpace(prev => ({ ...prev!, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Morada</label>
              <input
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ex: Largo Trindade Coelho, Lisboa"
                value={currentSpace?.address || ''}
                onChange={e => setCurrentSpace(prev => ({ ...prev!, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Link Google Maps</label>
              <input
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ex: https://goo.gl/maps/..."
                value={currentSpace?.googleMapLink || ''}
                onChange={e => setCurrentSpace(prev => ({ ...prev!, googleMapLink: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidade</label>
              <input
                required
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentSpace?.capacity || 1}
                onChange={e => setCurrentSpace(prev => ({ ...prev!, capacity: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Recursos Extras</label>
              <input
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ex: Projetor, Wi-Fi, Coffee"
                value={currentSpace?.extras || ''}
                onChange={e => setCurrentSpace(prev => ({ ...prev!, extras: e.target.value }))}
              />
            </div>
          </div>

          {/* Galeria de Fotos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Galeria de Fotos</label>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Cole o URL da imagem..."
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900"
              >
                Adicionar
              </button>
            </div>

            {Array.isArray(currentSpace?.images) && currentSpace.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {currentSpace.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma imagem adicionada.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={currentSpace?.description || ''}
              onChange={e => setCurrentSpace(prev => ({ ...prev!, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 py-2 p-3 bg-white rounded-lg border border-slate-100">
            <input
              type="checkbox"
              id="space-active"
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              checked={currentSpace?.active || false}
              onChange={e => setCurrentSpace(prev => ({ ...prev!, active: e.target.checked }))}
            />
            <label htmlFor="space-active" className="text-sm font-bold text-slate-700 cursor-pointer">Espaço Ativo / Disponível</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 disabled:opacity-50"
            >
              Salvar Espaço
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Spaces;
