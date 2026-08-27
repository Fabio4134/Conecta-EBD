import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { Student, Class, Sector, Church } from '../types.js';
import { Plus, Trash2, Search, UserPlus, Edit2, Power, PowerOff, X, Download, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils.js';
import Pagination from './Pagination.js';

export default function StudentList({ role }: { role: string }) {
  const isMasterOrSec = role === 'master' || role === 'secretary';
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', birth_date: '', class_id: '', church_id: '', sector_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sRes, cRes, secRes, chuRes] = await Promise.all([
      api.get('/students'),
      api.get('/classes'),
      isMasterOrSec ? api.get('/sectors').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      isMasterOrSec ? api.get('/churches').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]);
    setStudents(sRes.data || []);
    setClasses(cRes.data || []);
    setSectors(secRes.data || []);
    setChurches(chuRes.data || []);
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    const rawName = student.name || '';
    const phoneMatch = rawName.match(/\s*\(([^)]+)\)$/);
    const cleanName = phoneMatch ? rawName.replace(/\s*\([^)]+\)$/, '').trim() : rawName.trim();
    const cleanPhone = student.phone || (phoneMatch ? phoneMatch[1].trim() : '');

    setFormData({
      name: cleanName,
      phone: cleanPhone,
      birth_date: student.birth_date || '',
      class_id: student.class_id ? student.class_id.toString() : '',
      church_id: student.church_id ? student.church_id.toString() : '',
      sector_id: student.sector_id ? student.sector_id.toString() : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('O nome do aluno é obrigatório');
    if (!formData.phone.trim()) return alert('O telefone do aluno é obrigatório');

    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birth_date ? formData.birth_date : null,
        class_id: formData.class_id ? parseInt(formData.class_id) : null
      };
      if (isMasterOrSec && formData.church_id) {
        payload.church_id = parseInt(formData.church_id);
      }
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post('/students', payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', birth_date: '', class_id: '', church_id: '', sector_id: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar aluno');
    }
  };

  const handleDelete = async (id: number) => {
    if (role === 'secretary') {
      return alert('Secretários não possuem permissão para excluir registros.');
    }
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

  const availableChurches = filterSector
    ? churches.filter(c => c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
    : churches;

  const availableClasses = filterChurch
    ? classes.filter(c => c.church_name === filterChurch || c.church_id?.toString() === filterChurch)
    : filterSector
    ? classes.filter(c => c.sector_id === parseInt(filterSector) || c.sector_name === filterSector)
    : classes;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.toLowerCase().includes(search.toLowerCase())) ||
      s.church_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.sector_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.class_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSector = filterSector
      ? (s.sector_id === parseInt(filterSector) || s.sector_name === filterSector)
      : true;
    const matchesChurch = filterChurch
      ? (s.church_name === filterChurch || s.church_id?.toString() === filterChurch)
      : true;
    const matchesClass = filterClass
      ? (s.class_id?.toString() === filterClass || s.class_name === filterClass)
      : true;
    return matchesSearch && matchesSector && matchesChurch && matchesClass;
  });

  const isAll = pageSize >= filteredStudents.length || pageSize >= 9999;
  const paginatedStudents = isAll ? filteredStudents : filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, 15, { align: 'right' });

    // Summary block
    const activeCount = filteredStudents.filter(s => s.active).length;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const filterInfo = filterClass ? `Classe: ${classes.find(c => c.id.toString() === filterClass)?.name}` : 'Todas as classes';
    const sectorInfo = filterSector ? `Setor: ${sectors.find(s => s.id.toString() === filterSector)?.name || filterSector}` : 'Todos os Setores';
    const churchInfo = filterChurch ? `Congregação: ${churches.find(c => c.id.toString() === filterChurch)?.name || filterChurch}` : 'Todas as Congregações';
    doc.text(`Filtros: ${sectorInfo} | ${churchInfo} | ${filterInfo}  —  Total: ${filteredStudents.length} (${activeCount} Ativos)`, 14, 30);

    const tableData = filteredStudents.map((s, index) => [
      (index + 1).toString(),
      s.name,
      s.phone || 'Não informado',
      s.class_name || 'Sem classe',
      formatDate(s.birth_date),
      s.active ? 'Ativo' : 'Inativo',
      ...(role === 'master' ? [s.church_name || '—', s.sector_name || '—'] : [])
    ]);

    const head = [['#', 'Nome do Aluno', 'Telefone / WhatsApp', 'Classe', 'Data Nascimento', 'Status', ...(role === 'master' ? ['Congregação / Igreja', 'Setor'] : [])]];

    autoTable(doc, {
      startY: 34,
      head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3.5, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 18 }
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
              setFormData({ name: '', phone: '', birth_date: '', class_id: '', church_id: '', sector_id: '' });
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {isMasterOrSec && sectors.length > 0 && (
            <select
              className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
              value={filterSector}
              onChange={(e) => {
                setFilterSector(e.target.value);
                setFilterChurch('');
                setFilterClass('');
                setCurrentPage(1);
              }}
            >
              <option value="">Todos os Setores</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id.toString()}>{sec.name}</option>
              ))}
            </select>
          )}

          {isMasterOrSec && availableChurches.length > 0 && (
            <select
              className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
              value={filterChurch}
              onChange={(e) => {
                setFilterChurch(e.target.value);
                setFilterClass('');
                setCurrentPage(1);
              }}
            >
              <option value="">Todas as Congregações</option>
              {availableChurches.map(church => (
                <option key={church.id} value={church.name}>{church.name}</option>
              ))}
            </select>
          )}

          <select
            className="w-full sm:w-auto px-4 py-2.5 bg-white/50 border border-neutral-200/80 rounded-xl outline-none text-sm text-neutral-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm hover:bg-white/80"
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Todas as Classes</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}{isMasterOrSec && !filterChurch && c.church_name ? ` (${c.church_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-100">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone / WhatsApp</th>
                <th className="px-6 py-4">Classe</th>
                {isMasterOrSec && <th className="px-6 py-4">Igreja</th>}
                <th className="px-6 py-4">Nascimento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-neutral-50 transition-colors group ${!student.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-800">{student.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {student.phone ? (
                      <a
                        href={`https://wa.me/55${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`A Paz do Senhor, ${student.name}! Sentimos sua falta na Escola Bíblica Dominical (Classe: ${student.class_name || 'EBD'}). Esperamos por você no próximo domingo! 🙏📖`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg text-xs font-semibold transition-colors"
                        title="Enviar mensagem WhatsApp"
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
                  {isMasterOrSec && (
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
                      {role !== 'secretary' && (
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Excluir Aluno">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={isMasterOrSec ? 7 : 6} className="px-6 py-12 text-center text-neutral-400 text-sm">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="alunos"
        />
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

              {isMasterOrSec && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                      Setor
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-emerald-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-xs text-neutral-700"
                      value={formData.sector_id}
                      onChange={(e) => {
                        const secId = e.target.value;
                        setFormData({ ...formData, sector_id: secId, church_id: '', class_id: '' });
                      }}
                    >
                      <option value="">Todos os setores</option>
                      {sectors.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                      Congregação / Igreja *
                    </label>
                    <select
                      required={isMasterOrSec}
                      className="w-full px-3 py-2 bg-white border border-emerald-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-xs text-neutral-700"
                      value={formData.church_id}
                      onChange={(e) => {
                        const chuId = e.target.value;
                        const selectedChu = churches.find(c => c.id.toString() === chuId);
                        setFormData({
                          ...formData,
                          church_id: chuId,
                          sector_id: selectedChu?.sector_id?.toString() || formData.sector_id,
                          class_id: ''
                        });
                      }}
                    >
                      <option value="">Selecione a congregação</option>
                      {(formData.sector_id
                        ? churches.filter(c => c.sector_id?.toString() === formData.sector_id)
                        : churches
                      ).map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Classe *</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm text-neutral-700"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="">Selecione a classe</option>
                  {(isMasterOrSec && formData.church_id
                    ? classes.filter(c => c.church_id?.toString() === formData.church_id || c.church_name === churches.find(ch => ch.id.toString() === formData.church_id)?.name)
                    : isMasterOrSec && formData.sector_id
                    ? classes.filter(c => c.sector_id?.toString() === formData.sector_id)
                    : classes
                  ).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{isMasterOrSec && !formData.church_id && c.church_name ? ` (${c.church_name})` : ''}
                    </option>
                  ))}
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
