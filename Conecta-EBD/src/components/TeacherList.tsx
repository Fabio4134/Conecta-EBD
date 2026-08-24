import React, { useState, useEffect } from 'react';
import api from '../api';
import { Teacher, Class } from '../types';
import { Users, Search, GraduationCap, Plus, Edit2, Trash2, X, Power, PowerOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function TeacherList({ role }: { role: string }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', class_id: '' });

  // Get unique churches for the filter
  const uniqueChurches = Array.from(new Set(teachers.map(t => t.church_name).filter(Boolean))) as string[];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [tRes, cRes] = await Promise.all([
      api.get('/teachers'),
      api.get('/classes')
    ]);
    setTeachers(tRes.data);
    setClasses(cRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/teachers/${editingId}`, formData);
      } else {
        await api.post('/teachers', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', class_id: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar professor');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, class_id: teacher.class_id.toString() });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este professor?')) {
      try {
        await api.delete(`/teachers/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir professor. Verifique se existem escalas vinculadas.');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/teachers/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert('Erro ao alterar status do professor');
    }
  };

  const filtered = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.class_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.church_name?.toLowerCase().includes(search.toLowerCase());
    const matchesChurch = filterChurch ? t.church_name === filterChurch : true;
    return matchesSearch && matchesChurch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Professores</h1>
          <p className="text-neutral-500 text-sm italic serif">Corpo docente da Escola Bíblica.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          <Plus size={18} />
          Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-neutral-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-neutral-200">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nome, classe ou igreja..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {role === 'master' && uniqueChurches.length > 0 && (
            <select
              className="w-full sm:w-auto px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500"
              value={filterChurch}
              onChange={(e) => setFilterChurch(e.target.value)}
            >
              <option value="">Todas as Igrejas</option>
              {uniqueChurches.map(church => (
                <option key={church} value={church}>{church}</option>
              ))}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Classe Designada</th>
                {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((teacher) => (
                <tr key={teacher.id} className={`hover:bg-neutral-50 transition-colors group ${!teacher.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${teacher.active ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                        {teacher.name.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-neutral-800">{teacher.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold uppercase tracking-widest">{teacher.class_name}</span>
                  </td>
                  {role === 'master' && <td className="px-6 py-4 text-xs text-neutral-500 font-mono">{teacher.church_name}</td>}
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${teacher.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {teacher.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleStatus(teacher.id)} className={`p-2 rounded-lg ${teacher.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}>
                        {teacher.active ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button onClick={() => handleEdit(teacher)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(teacher.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Professor' : 'Novo Professor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Nome Completo</label>
                <input required type="text" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Classe</label>
                <select required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none" value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}>
                  <option value="">Selecione a classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium shadow-lg">Salvar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

