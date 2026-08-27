import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Church, Sector, Student } from '../types';
import { 
  Building2, Users, Map as MapIcon, MapPin, Download, 
  Search, Filter, ArrowLeft, Layers, Church as ChurchIcon, Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SALVADOR_PREFEITURAS, findBairro, inferBairroFromText, PrefeituraBairro } from '../lib/salvador-bairros';
import SalvadorMap, { ChurchMapItem } from './SalvadorMap';
import Pagination from './Pagination.js';

export default function MapaSvador({ role }: { role: string }) {
  const isMasterOrSec = role === 'master' || role === 'secretary';
  const [churches, setChurches] = useState<Church[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedPbId, setSelectedPbId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, secRes, sRes] = await Promise.all([
        api.get('/churches'),
        api.get('/sectors').catch(() => ({ data: [] })),
        api.get('/students').catch(() => ({ data: [] }))
      ]);

      setChurches(cRes.data || []);
      setSectors(secRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do mapa:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mapeia congregações com contagem de alunos da EBD
  const mappedChurches: ChurchMapItem[] = useMemo(() => {
    return churches.map((c) => {
      const churchStudents = students.filter(s => s.church_id === c.id || s.church_name === c.name);
      return {
        ...c,
        students_count: churchStudents.length,
        members: c.members || churchStudents.length || 0
      };
    });
  }, [churches, students]);

  // Estatísticas por Prefeitura-Bairro
  const pbStats = useMemo(() => {
    return SALVADOR_PREFEITURAS.map((pb) => {
      const templos = mappedChurches.filter((i) => {
        if (selectedSectorId && i.sector_id?.toString() !== selectedSectorId && i.sector_name !== selectedSectorId) {
          return false;
        }
        const bInfo = (i.bairro ? findBairro(i.bairro) : null) || inferBairroFromText(`${i.name} ${i.sector_name || ''}`);
        return bInfo && bInfo.pbId === pb.id;
      });

      const totalPessoas = templos.reduce((acc, curr) => acc + (curr.students_count || curr.members || 0), 0);

      return {
        ...pb,
        templosCount: templos.length,
        pessoasCount: totalPessoas
      };
    });
  }, [mappedChurches, selectedSectorId]);

  // Filtragem da tabela inferior
  const filteredChurches = useMemo(() => {
    return mappedChurches.filter((i) => {
      // Filtro por Setor
      if (selectedSectorId && i.sector_id?.toString() !== selectedSectorId && i.sector_name !== selectedSectorId) {
        return false;
      }

      // Filtro por Prefeitura-Bairro
      if (selectedPbId !== null) {
        const bInfo = (i.bairro ? findBairro(i.bairro) : null) || inferBairroFromText(`${i.name} ${i.sector_name || ''}`);
        if (!bInfo || bInfo.pbId !== selectedPbId) {
          return false;
        }
      }

      // Busca por texto
      if (search) {
        const term = search.toLowerCase();
        const matchName = i.name.toLowerCase().includes(term);
        const matchPastor = i.pastor?.toLowerCase().includes(term);
        const matchSector = i.sector_name?.toLowerCase().includes(term);
        const matchBairro = i.bairro?.toLowerCase().includes(term);
        if (!matchName && !matchPastor && !matchSector && !matchBairro) {
          return false;
        }
      }

      return true;
    });
  }, [mappedChurches, selectedSectorId, selectedPbId, search]);

  const totalAlunosEMembros = useMemo(() => {
    return mappedChurches.reduce((acc, curr) => acc + (curr.students_count || curr.members || 0), 0);
  }, [mappedChurches]);

  const selectedPbInfo = selectedPbId ? SALVADOR_PREFEITURAS.find(p => p.id === selectedPbId) : null;
  const selectedSectorInfo = selectedSectorId ? sectors.find(s => s.id.toString() === selectedSectorId || s.name === selectedSectorId) : null;

  const isAll = pageSize >= filteredChurches.length || pageSize >= 9999;
  const paginatedChurches = isAll ? filteredChurches : filteredChurches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Exportar Relatório PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();

    // Cabeçalho Premium
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CONECTA EBD — MAPA DE IGREJAS E SETORES', 15, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`GEORREFERENCIAMENTO DOS TEMPLOS E DISTRIBUIÇÃO EM SALVADOR`, 15, 23);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total Templos: ${mappedChurches.length}`, pageW - 15, 23, { align: 'right' });

    // Painel de Métricas
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 42, 180, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 42, 180, 20);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMO GERAL REGISTRADO:', 20, 48);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Congregações: ${mappedChurches.length}`, 20, 55);
    doc.text(`Total de Alunos EBD & Membros: ${totalAlunosEMembros}`, 85, 55);
    doc.text(`Setores Ativos: ${sectors.length}`, 150, 55);

    // Tabela 1: Distribuição por Região de Salvador
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('DISTRIBUIÇÃO POR REGIÃO DE SALVADOR', 15, 70);

    const pbTableBody = pbStats.map(pb => [
      pb.nome,
      pb.templosCount.toString(),
      pb.pessoasCount.toString(),
      mappedChurches.length > 0 ? `${Math.round((pb.templosCount / mappedChurches.length) * 100)}%` : '0%'
    ]);

    autoTable(doc, {
      startY: 74,
      head: [['Divisão Regional de Salvador', 'Qtd. Congregações', 'Alunos / Membros', '% do Total']],
      body: pbTableBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { fontSize: 8.5 }
    });

    // Nova Página: Detalhamento de Igrejas
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LISTAGEM DE TEMPLOS, SETORES E LOCALIZAÇÃO', 15, 13);

    const churchesTableBody = mappedChurches.map(i => {
      const bInfo = (i.bairro ? findBairro(i.bairro) : null) || inferBairroFromText(`${i.name} ${i.sector_name || ''}`);
      const pbName = bInfo ? (SALVADOR_PREFEITURAS.find(p => p.id === bInfo.pbId)?.nome || 'Salvador') : 'Salvador';
      return [
        i.name,
        i.pastor || 'Não informado',
        i.sector_name || 'Setor Geral',
        bInfo?.nome || i.bairro || 'Salvador',
        pbName,
        (i.students_count || i.members || 0).toString()
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['Congregação', 'Pastor Responsável', 'Setor', 'Bairro', 'Região Salvador', 'Alunos/Membros']],
      body: churchesTableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 15, halign: 'center' }
      }
    });

    doc.save(`mapa-igrejas-salvador-conecta-ebd-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
            <MapIcon className="text-emerald-600" size={26} />
            Mapa de Igrejas — Salvador
          </h1>
          <p className="text-neutral-500 text-sm italic serif">
            Georreferenciamento dos templos, congregações da EBD e distribuição de alunos em Salvador.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportPDF}
            disabled={mappedChurches.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
          >
            <Download size={16} />
            Exportar Relatório PDF
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Total de Templos</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">{mappedChurches.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Alunos & Membros</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">{totalAlunosEMembros}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
            <MapPin size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Filtro Ativo</p>
            <p className="text-sm font-bold text-neutral-800 mt-1 uppercase truncate">
              {selectedPbInfo ? selectedPbInfo.nome : selectedSectorInfo ? `Setor: ${selectedSectorInfo.name}` : 'TODAS AS REGIÕES'}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="glass-panel p-4 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search size={18} className="absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por congregação, pastor, bairro ou setor..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {sectors.length > 0 && (
          <div className="w-full md:w-56">
            <select
              value={selectedSectorId}
              onChange={(e) => {
                setSelectedSectorId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-white/80 border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-neutral-700"
            >
              <option value="">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id.toString()}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedPbId !== null || selectedSectorId !== '' || search !== '') && (
          <button
            onClick={() => {
              setSelectedPbId(null);
              setSelectedSectorId('');
              setSearch('');
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Grid: Lista de Regiões de Salvador + Mapa Leaflet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Lateral das Regiões de Salvador */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-600" />
              Regiões de Salvador
            </h2>
            {selectedPbId !== null && (
              <button
                onClick={() => setSelectedPbId(null)}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Ver Todas
              </button>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-3 max-h-[460px] overflow-y-auto custom-scrollbar space-y-1.5 shadow-xl">
            {loading ? (
              <div className="py-12 text-center text-neutral-500 text-xs">Carregando regiões...</div>
            ) : (
              pbStats.map((pb) => {
                const isSelected = selectedPbId === pb.id;
                return (
                  <button
                    key={pb.id}
                    onClick={() => {
                      setSelectedPbId(isSelected ? null : pb.id);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left py-2.5 px-3 flex items-center justify-between transition-all rounded-2xl ${
                      isSelected
                        ? 'bg-white/10 border border-white/20 shadow-md'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: pb.cor }} />
                      <span className={`text-xs uppercase tracking-tight truncate ${isSelected ? 'font-bold text-white' : 'font-medium text-neutral-300'}`}>
                        {pb.nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 border border-white/5">
                        {pb.templosCount} T
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                        {pb.pessoasCount} M
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Mapa Interativo de Salvador */}
        <div className="lg:col-span-8 min-h-[460px]">
          {loading ? (
            <div className="w-full h-[460px] flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800 rounded-3xl text-neutral-500 text-sm">
              <Sparkles className="animate-spin text-emerald-500 mb-2" size={28} />
              Carregando Mapa de Salvador...
            </div>
          ) : (
            <div className="h-[460px] w-full">
              <SalvadorMap
                churches={mappedChurches}
                selectedPbId={selectedPbId}
                onSelectPB={(pbId) => {
                  setSelectedPbId(pbId);
                  setCurrentPage(1);
                }}
                selectedSectorId={selectedSectorId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Templos e Congregações da Região */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <ChurchIcon size={16} className="text-indigo-600" />
            Templos da Região Selecionada ({filteredChurches.length})
          </h2>
        </div>

        <div className="glass-panel rounded-3xl shadow-sm border border-neutral-200/80 overflow-hidden">
          {filteredChurches.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-sm">
              Nenhuma congregação encontrada para os filtros selecionados.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/40 text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-200/50">
                      <th className="px-6 py-4">Igreja / Congregação</th>
                      <th className="px-6 py-4">Pastor Vinculado</th>
                      <th className="px-6 py-4">Setor</th>
                      <th className="px-6 py-4">Bairro / Região Salvador</th>
                      <th className="px-6 py-4 text-center">Alunos EBD / Membros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/50">
                    {paginatedChurches.map((item) => {
                      const bInfo = (item.bairro ? findBairro(item.bairro) : null) || inferBairroFromText(`${item.name} ${item.sector_name || ''}`);
                      const pbInfo = bInfo ? SALVADOR_PREFEITURAS.find(p => p.id === bInfo.pbId) : null;

                      return (
                        <tr key={item.id} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center font-black text-xs text-emerald-400 shadow-sm uppercase shrink-0">
                                {item.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-neutral-900">{item.name}</p>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{item.type || 'Congregação EBD'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                            {item.pastor || <span className="text-neutral-400 italic">Não informado</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold border border-purple-100">
                              {item.sector_name || 'Setor Geral'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {pbInfo && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pbInfo.cor }} />}
                              <span className="text-xs font-bold text-neutral-800 uppercase">
                                {bInfo?.nome || item.bairro || 'Salvador'}
                              </span>
                              {pbInfo && (
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  ({pbInfo.nome})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Users size={12} />
                              {item.students_count || item.members || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={filteredChurches.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50]}
                itemName="congregações"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
