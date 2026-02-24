import React, { useState, useEffect } from 'react';
import api from '../api';
import { Material } from '../types';
import { Upload, FileText, Image as ImageIcon, Download, Eye, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudyMaterial({ role }: { role: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const res = await api.get('/materials');
    setMaterials(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    if (cover) {
      formData.append('cover', cover);
    }

    try {
      await api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setTitle('');
      setFile(null);
      setCover(null);
      fetchMaterials();
    } catch (err) {
      alert('Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este material?')) {
      try {
        await api.delete(`/materials/${id}`);
        fetchMaterials();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir material');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Material de Estudo</h1>
          <p className="text-neutral-500 text-sm italic serif">Acesse e baixe materiais de apoio para as classes.</p>
        </div>
        {role === 'master' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
          >
            <Upload size={18} />
            Upload Material
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden group"
          >
            <div className="aspect-video bg-neutral-100 flex items-center justify-center relative overflow-hidden">
              {m.cover_path ? (
                <img src={m.cover_path} alt={`Capa de ${m.title}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : m.file_type.includes('image') ? (
                <img src={m.file_path} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <FileText size={48} className="text-neutral-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a href={m.file_path} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-lg text-neutral-900 hover:bg-emerald-500 hover:text-white transition-all">
                  <Eye size={20} />
                </a>
                <a href={m.file_path} download className="p-2 bg-white rounded-lg text-neutral-900 hover:bg-emerald-500 hover:text-white transition-all">
                  <Download size={20} />
                </a>
                {role === 'master' && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 bg-white rounded-lg text-neutral-900 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-neutral-800 truncate">{m.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                  {m.file_type.split('/')[1].toUpperCase()}
                </span>
                {role === 'master' && (
                  <span className="text-[10px] text-neutral-400 italic font-mono">{m.church_name}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Upload de Material</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Título do Material</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Arquivo (PDF ou JPEG)</label>
                <div className="relative group">
                  <input
                    required
                    type="file"
                    accept=".pdf,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="w-full px-4 py-8 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-emerald-500 transition-all">
                    <Upload size={24} className="text-neutral-400 group-hover:text-emerald-500" />
                    <p className="text-sm text-neutral-500 font-medium text-center">{file ? file.name : 'Clique ou arraste o arquivo principal'}</p>
                  </div>
                </div>
              </div>

              {file?.type === 'application/pdf' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Capa do Material (Opcional - Imagem)</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setCover(e.target.files?.[0] || null)}
                    />
                    <div className="w-full px-4 py-4 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-1 group-hover:border-emerald-500 transition-all">
                      <ImageIcon size={20} className="text-neutral-400 group-hover:text-emerald-500" />
                      <p className="text-xs text-neutral-500 font-medium text-center">{cover ? cover.name : 'Adicionar capa (opcional)'}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Fazer Upload'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
