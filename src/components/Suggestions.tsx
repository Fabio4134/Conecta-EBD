import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { Suggestion } from '../types';
import { motion } from 'motion/react';

interface SuggestionsProps {
    role: 'master' | 'standard';
}

export default function Suggestions({ role }: SuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [answeringId, setAnsweringId] = useState<number | null>(null);
    const [answerText, setAnswerText] = useState('');

    useEffect(() => {
        if (role === 'master') {
            fetchSuggestions();
        }
    }, [role]);

    const fetchSuggestions = async () => {
        try {
            const response = await fetch('/api/suggestions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Falha ao buscar sugestões');
            const data = await response.json();
            setSuggestions(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Falha ao enviar sugestão');

            setSuccess('Sua sugestão foi enviada com sucesso! Agradecemos o seu contato.');
            setText('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (id: number) => {
        if (!answerText.trim()) return;

        try {
            const response = await fetch(`/api/suggestions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ answer: answerText })
            });

            if (!response.ok) throw new Error('Falha ao responder sugestão');

            setAnsweringId(null);
            setAnswerText('');
            fetchSuggestions();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (role === 'standard') {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">Sugestões e Ajustes</h1>
                    <p className="text-neutral-500 text-lg max-w-2xl">
                        Este espaço é destinado a relatos de possíveis instabilidades, inconsistências ou para sugerir melhorias no sistema. Sua colaboração é muito importante para nós!
                    </p>
                </header>

                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <MessageSquare size={120} />
                    </div>

                    <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Descreva sua sugestão ou problema
                                </label>
                                <textarea
                                    required
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Digite aqui os detalhes da sua sugestão ou problema encontrado..."
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none min-h-[150px]"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !text.trim()}
                                className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                {loading ? 'Enviando...' : (
                                    <>
                                        <Send size={18} />
                                        Enviar Sugestão
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Master View
    return (
        <div className="space-y-6 flex flex-col h-full">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">Sugestões e Ajustes</h1>
                    <p className="text-neutral-500 text-lg">
                        Acompanhe e responda às sugestões enviadas pelas igrejas.
                    </p>
                </div>
            </header>

            <div className="grid gap-4 flex-1 content-start">
                {suggestions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-300">
                        <Inbox className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-1">Nenhuma sugestão recebida</h3>
                        <p className="text-neutral-500">Quando os usuários enviarem sugestões, elas aparecerão aqui.</p>
                    </div>
                ) : (
                    suggestions.map((suggestion) => (
                        <motion.div
                            layout
                            key={suggestion.id}
                            className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${suggestion.status === 'answered' ? 'border-neutral-200/60 bg-neutral-50/50' : 'border-emerald-200 bg-emerald-50/10'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-neutral-900">{suggestion.church_name}</span>
                                        <span className="text-neutral-300">•</span>
                                        <span className="text-neutral-600 text-sm">{suggestion.user_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Clock size={14} />
                                        {new Date(suggestion.created_at).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div>
                                    {suggestion.status === 'answered' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                            <CheckCircle2 size={12} />
                                            Respondida
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                            <Clock size={12} />
                                            Pendente
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-neutral-700 bg-white p-4 rounded-lg border border-neutral-100 text-sm leading-relaxed mb-4">
                                {suggestion.text}
                            </div>

                            {suggestion.status === 'answered' ? (
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-sm">
                                    <div className="font-medium text-emerald-800 mb-1 flex items-center gap-1.5">
                                        <CheckCircle2 size={14} /> Sua resposta:
                                    </div>
                                    <div className="text-emerald-700">{suggestion.answer}</div>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-neutral-100">
                                    {answeringId === suggestion.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={answerText}
                                                onChange={(e) => setAnswerText(e.target.value)}
                                                placeholder="Digite sua resposta..."
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none min-h-[100px]"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setAnsweringId(null);
                                                        setAnswerText('');
                                                    }}
                                                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleAnswer(suggestion.id)}
                                                    disabled={!answerText.trim()}
                                                    className="px-3 py-1.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                                                >
                                                    <Send size={14} />
                                                    Enviar Resposta
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setAnsweringId(suggestion.id);
                                                setAnswerText('');
                                            }}
                                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                                        >
                                            <MessageSquare size={14} />
                                            Responder a esta sugestão
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
