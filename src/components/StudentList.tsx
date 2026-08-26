import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Student, Class } from '../types.js';
import { Plus, Trash2, Search, UserPlus, Edit2, Power, PowerOff, X, Download, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils.js';

export default function StudentList({ role }: { role: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', birth_date: '', class_id: '' });

  const uniqueChurches = Array.from(new Set(students.map(s => s.church_name).filter(Boolean))) as string[];

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
      phone: student.phone || '',
      birth_date: student.birth_date || '',
      class_id: student.class_id ? student.class_id.toString() : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('O nome do aluno é obrigatório');
    if (!formData.phone.trim()) return alert('O telefone do aluno é obrigatório');

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birth_date ? formData.birth_date : null,
        class_id: formData.class_id ? parseInt(formData.class_id) : null
      };
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post('/students', payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', birth_date: '', class_id: '' });
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

  const availableClasses = filterChurch
    ? classes.filter(c => c.church_name === filterChurch)
    : classes;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
      s.church_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.class_name?.toLowerCase().includes(search.toLowerCase());
    const matchesChurch = filterChurch ? s.church_name === filterChurch : true;
    const matchesClass = filterClass ? (s.class_id?.toString() === filterClass || s.class_name === filterClass) : true;
    return matchesSearch && matchesChurch && matchesClass;
  });

  const downloadStudentsPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Conecta EBD — Relação Geral de Alunos', 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total: ${filteredStudents.length} alunos`, pageW - 14, 15, { align: 'right' });

    // Summary block
    const activeCount = filteredStudents.filter(s => s.active).length;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const filterInfo = filterClass ? `Classe: ${classes.find(c => c.id.toString() === filterClass)?.name}` : 'Todas as classes';
    doc.text(`Filtros: ${filterInfo} ${filterChurch ? `| Igreja: ${filterChurch}` : ''}  —  Total: ${filteredStudents.length} (${activeCount} Ativos)`, 14, 30);

    const tableData = filteredStudents.map((s, index) => [
      (index + 1).toString(),
      s.name,
      s.phone || 'Não informado',
      s.class_name || 'Sem classe',
      formatDate(s.birth_date),
      s.active ? 'Ativo' : 'Inativo',
      ...(role === 'master' ? [s.church_name || ''] : [])
    ]);

    const head = [['#', 'Nome do Aluno', 'Telefone / WhatsApp', 'Classe', 'Data Nascimento', 'Status', ...(role === 'master' ? ['Igreja'] : [])]];

    autoTable(doc, {
      startY: 34,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { fontStyle: 'bold', cellWidth: 65 },
        2: { cellWidth: 40 },
        3: { cellWidth: 45 },
        4: { halign: 'center', cellWidth: 32 },
        5: { halign: 'center', cellWidth: 22 }
      }
    });

    doc.save('relatorio-alunos-ebd.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestão de Alunos</h1>
          <p className="text-neutral-500 text-sm italic serif">Cadastre e gerencie os alunos da sua igreja.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={downloadStudentsPDF}
            disabled={filteredStudents.length === 0}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
            title="Baixar lista completa de alunos em PDF"
          >
            <Download size={18} />
            Baixar Alunos (PDF)
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setFormData({ name: '', phone: '', birth_date: '', class_id: '' });
            }}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 font-semibold text-sm"
          >
            <UserPlus size={18} />
            Novo Aluno
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-neutral-200/50 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-white/50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-neutral-200/80 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all shadow-sm">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, classe ou igreja..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">Todas as Classes</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}{role === 'master' && !filterChurch && c.church_name ? ` (${c.church_name})` : ''}
              </option>
            ))}
          </select>

          {role === 'master' && uniqueChurches.length > 0 && (
            <select
              className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
              value={filterChurch}
              onChange={(e) => {
                setFilterChurch(e.target.value);
                setFilterClass('');
              }}
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
              <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-100">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone / WhatsApp</th>
                <th className="px-6 py-4">Classe</th>
                {role === 'master' && <th className="px-6 py-4">Igreja</th>}
                <th className="px-6 py-4">Nascimento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-neutral-50 transition-colors group ${!student.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-800">{student.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {student.phone ? (
                      <a
                        href={`https://wa.me/55${student.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg text-xs font-semibold transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle size={13} className="text-emerald-600" />
                        {student.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg font-medium">{student.class_name || 'Sem classe'}</span>
                  </td>
                  {role === 'master' && (
                    <td className="px-6 py-4 text-xs text-neutral-500 font-mono italic">{student.church_name}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(student.birth_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest ${student.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {student.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleStatus(student.id)} className={`p-2 rounded-lg ${student.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`} title={student.active ? 'Desativar' : 'Ativar'}>
                        {student.active ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button onClick={() => handleEdit(student)} className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar Aluno">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir Aluno">
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
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Editar Aluno' : 'Cadastrar Aluno'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Nome Completo *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-neutral-800"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maria Oliveira"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Telefone / WhatsApp *</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-neutral-800"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(71) 99999-9999"
                  />
                  <Phone className="absolute left-3.5 top-3.5 text-neutral-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                  Data de Nascimento <span className="text-neutral-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-neutral-800"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Classe *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-neutral-700"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="">Selecione a classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
