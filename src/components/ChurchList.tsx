import React, { useState, useEffect } from 'react';
import api from '../api';
import { Church } from '../types';
import { Plus, Trash2, Search, Edit2, Church as ChurchIcon, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function ChurchList({ role }: { role: string }) {
    const [churches, setChurches] = useState<Church[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', type: '', pastor: '', members: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const res = await api.get('/churches');
        setChurches(res.data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/churches/${editingId}`, formData);
            } else {
                await api.post('/churches', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', type: '', pastor: '', members: '' });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar igreja');
        }
    };

    const handleEdit = (church: Church) => {
        setEditingId(church.id);
        setFormData({
            name: church.name,
            type: church.type,
            pastor: church.pastor || '',
            members: (church.members || '').toString()
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Deseja realmente excluir esta igreja?')) {
            try {
                await api.delete(`/churches/${id}`);
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.error || 'Erro ao excluir. Verifique se há dados vinculados.');
            }
        }
    };

    const filtered = churches.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.type?.toLowerCase().includes(search.toLowerCase()) ||
        c.pastor?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Igrejas</h1>
                    <p className="text-neutral-500 text-sm italic serif">Gerencie as igrejas cadastradas no sistema.</p>
                </div>
                {role === 'master' && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', type: '', pastor: '', members: '' }); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                    >
                        <Plus size={18} />
                        Nova Igreja
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
                    <Search size={18} className="text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, tipo ou pastor..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                                <th className="px-6 py-4">Igreja</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Pastor</th>
                                <th className="px-6 py-4">Membros</th>
                                {role === 'master' && <th className="px-6 py-4 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filtered.map((church) => (
                                <tr key={church.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <ChurchIcon size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-neutral-800">{church.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold uppercase tracking-widest">{church.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{church.pastor || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                                            <Users size={14} className="text-neutral-400" />
                                            {church.members ?? 0}
                                        </div>
                                    </td>
                                    {role === 'master' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(church)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(church.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-sm">Nenhuma igreja encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6">{editingId ? 'Editar Igreja' : 'Nova Igreja'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Nome da Igreja</label>
                                <input required type="text" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Tipo</label>
                                <select required className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="">Selecione o tipo</option>
                                    <option value="Sede">Sede</option>
                                    <option value="Congregação">Congregação</option>
                                    <option value="Ponto de Pregação">Ponto de Pregação</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Pastor</label>
                                <input type="text" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.pastor} onChange={(e) => setFormData({ ...formData, pastor: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Nº de Membros</label>
                                <input type="number" min="0" className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.members} onChange={(e) => setFormData({ ...formData, members: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-medium">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-100">Salvar</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
