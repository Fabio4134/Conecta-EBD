import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import { Church, Class } from '../types.js';
import { Download, TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import html2canvas from 'html2canvas';

export default function Statistics({ role }: { role: string }) {
    const [statsData, setStatsData] = useState<any[]>([]);
    const [classesData, setClassesData] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef<HTMLDivElement>(null);

    // Modern color palette
    const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // In a real scenario, you'd fetch specific computed stats from a new API endpoint.
            // E.g., api.get('/statistics')
            // Here we will mock or aggregate existing data for demonstration if there is no endpoint.
            // Let's assume we can pull raw attendance records and aggregate them, or an endpoint provides it.

            const [attRes, classRes] = await Promise.all([
                api.get('/attendance'),
                api.get('/classes')
            ]);

            const attendances = attRes.data || [];
            const classesList = classRes.data || [];

            setClassesData(classesList);

            // Aggregating attendance by class
            const aggregated = classesList.map((c: Class) => {
                const classAttendances = attendances.filter((a: any) => a.class_id === c.id);
                const present = classAttendances.filter((a: any) => a.present).length;
                const total = classAttendances.length;
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;

                return {
                    name: c.name,
                    presentes: present,
                    ausentes: total - present,
                    taxa: rate,
                    total: total
                };
            });

            setStatsData(aggregated);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!chartRef.current) return;
        try {
            const canvas = await html2canvas(chartRef.current, { backgroundColor: '#fcfcfc' });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `EBD_Estatisticas_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            alert("Erro ao gerar imagem.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Estatísticas</h1>
                    <p className="text-neutral-500 text-sm italic serif">Visualização e acompanhamento de dados da EBD.</p>
                </div>
                <button
                    onClick={handleDownloadImage}
                    className="bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm font-bold text-sm"
                >
                    <Download size={18} className="text-purple-600" />
                    Exportar Gráficos
                </button>
            </div>

            <div ref={chartRef} className="space-y-6 p-2 bg-[#fcfcfc] rounded-3xl">
                {/* Sumário */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">Total de Presenças</p>
                            <h3 className="text-3xl font-bold text-neutral-900">
                                {statsData.reduce((acc, curr) => acc + curr.presentes, 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-2xl shadow-inner">
                            <Users size={24} />
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">Faltas Registradas</p>
                            <h3 className="text-3xl font-bold text-neutral-900">
                                {statsData.reduce((acc, curr) => acc + curr.ausentes, 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-2xl shadow-inner">
                            <Activity size={24} />
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-purple-100 bg-gradient-to-br from-white to-purple-50/50">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-purple-600/80 font-bold mb-1">Taxa de Assiduidade Média</p>
                            <h3 className="text-3xl font-bold text-purple-700">
                                {statsData.length > 0
                                    ? Math.round(statsData.reduce((acc, curr) => acc + curr.taxa, 0) / statsData.length)
                                    : 0}%
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-purple-500/20">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <BarChart2 size={20} className="text-purple-500" />
                            Presenças por Classe
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="presentes" name="Presentes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="ausentes" name="Faltas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-emerald-500" />
                            Taxa de Participação (%)
                        </h3>
                        <div className="h-72 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={statsData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="taxa" name="Taxa de Presença (%)" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Aux icon definitions if not imported
const BarChart2 = ({ size, className }: { size: number, className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
)
