import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Student, Class } from '../types.js';
import { Plus, Trash2, Search, UserPlus, Edit2, Power, PowerOff } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../utils.js';

export default function StudentList({ role }: { role: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', birth_date: '', class_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sRes, cRes] = await Promise.all([
      api.get('/students'),
      api.get('/classes')
    ]);
    setStudents(sRes.data);
    setClasses(cRes.data);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name,
      birth_date: student.birth_date,
      class_id: student.class_id.toString()
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', birth_date: '', class_id: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar aluno');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este aluno?')) {
      try {
        await api.delete(`/students/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir aluno. Verifique se existem registros vinculados.');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/students/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert('Erro ao alterar status do aluno');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.church_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestão de Alunos</h1>
          <p className="text-neutral-500 text-sm italic serif">Cadastre e gerencie os alunos da sua igreja.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus size={18} />
          Novo Aluno
        </button>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-neutral-200/50 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-white/50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou igreja..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Classe</th>
                {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                <th className="px-6 py-4">Nascimento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-white/40 transition-colors group ${!student.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-800">{student.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-lg font-medium">{student.class_name}</span>
                  </td>
                  {role === 'master' && (
                    <td className="px-6 py-4 text-xs text-neutral-500 font-mono italic">{student.church_name}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(student.birth_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${student.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {student.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleStatus(student.id)} className={`p-2 rounded-lg ${student.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}>
                        {student.active ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button onClick={() => handleEdit(student)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/60"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Aluno' : 'Cadastrar Aluno'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Data de Nascimento</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Classe</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-white/50 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm appearance-none"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="">Selecione a classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-neutral-200/80 text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all font-bold text-sm bg-white/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 mt-0"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
