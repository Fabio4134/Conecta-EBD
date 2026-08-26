import React, { useState, useEffect } from 'react';
import api from '../api';
import { GraduationCap, CheckCircle2, AlertCircle, Sparkles, UserCheck, Calendar, ArrowRight, UserPlus, Phone } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  classId: string;
}

interface ClassInfo {
  id: number;
  name: string;
  active: boolean;
  church_id: number;
  church_name?: string;
}

export default function StudentSelfRegister({ classId }: Props) {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: ''
  });

  useEffect(() => {
    fetchClassInfo();
  }, [classId]);

  const fetchClassInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/public/classes/${classId}`);
      setClassInfo(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Classe não encontrada ou indisponível para cadastro no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError('Por favor, informe seu nome completo.');
    if (!formData.phone.trim()) return setError('Por favor, informe seu telefone de contato.');

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/public/classes/${classId}/register`, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birth_date ? formData.birth_date : null
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setFormData({ name: '', phone: '', birth_date: '' });
    setSuccess(false);
    setError('');
  };

  return (
    <div className="min-h-screen premium-gradient flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3 ring-4 ring-white/80">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">
            Conecta EBD
          </h1>
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mt-0.5">
            Escola Bíblica Dominical
          </p>
        </div>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 backdrop-blur-xl bg-white/80"
        >
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-neutral-500 text-sm font-medium">Carregando informações da classe...</p>
            </div>
          ) : error && !classInfo ? (
            <div className="py-10 text-center space-y-5">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Não foi possível carregar a classe</h2>
                <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">{error}</p>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all shadow-md"
              >
                Voltar à página inicial
              </a>
            </div>
          ) : success ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-6 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50">
                <CheckCircle2 size={44} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                  <Sparkles size={14} /> Matrícula Confirmada
                </span>
                <h2 className="text-2xl font-black text-neutral-900">
                  Parabéns, {formData.name.split(' ')[0]}!
                </h2>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Seu cadastro foi realizado com sucesso na classe <strong className="text-emerald-700 font-bold">{classInfo?.name}</strong>
                  {classInfo?.church_name ? ` da ${classInfo.church_name}` : ''}.
                </p>
                <p className="text-xs text-neutral-400 mt-2 italic">
                  Seu nome já está disponível na lista de chamada da sua turma.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRegisterAnother}
                  className="flex-1 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  Cadastrar outro aluno
                </button>
                <a
                  href="/"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Ir para o Conecta EBD
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          ) : (
            <div>
              {/* Class target banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  <UserCheck size={14} />
                  Autocadastro de Aluno
                </div>
                <div className="mt-1 text-lg font-bold text-neutral-900">
                  {classInfo?.name}
                </div>
                {classInfo?.church_name && (
                  <div className="text-xs text-neutral-500 font-medium mt-0.5">
                    {classInfo.church_name}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Digite seu nome e sobrenome"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium text-neutral-800"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="(00) 00000-0000"
                      className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium text-neutral-800"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Phone className="absolute left-3.5 top-3.5 text-neutral-400" size={18} />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Será usado para comunicados e avisos da turma.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Data de Nascimento <span className="text-neutral-400 font-normal normal-case">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm text-neutral-800"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Não é obrigatório preencher para realizar a matrícula.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting || !formData.name.trim()}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Confirmar Meu Cadastro</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
                <p className="text-[11px] text-neutral-400">
                  Dúvidas sobre sua turma? Fale com o seu professor ou superintendente da EBD.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
