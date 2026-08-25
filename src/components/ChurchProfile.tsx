import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Church } from '../types';
import { Upload, Save, Building2, CheckCircle, AlertCircle, X, ImagePlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChurchProfileProps {
  user: { id: number; role: string; church_id: number };
}

export default function ChurchProfile({ user }: ChurchProfileProps) {
  const [church, setChurch] = useState<Church | null>(null);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChurch();
  }, []);

  const fetchChurch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/churches');
      const found: Church = res.data.find((c: Church) =>
        user.role === 'master' ? true : c.id === user.church_id
      );
      // Para master, carrega a primeira (pode filtrar depois); para standard, carrega a própria
      const mine = user.role === 'master'
        ? res.data.find((c: Church) => c.id === user.church_id) || res.data[0]
        : res.data.find((c: Church) => c.id === user.church_id);

      if (mine) {
        setChurch(mine);
        setName(mine.name);
        if (mine.logo_url) setPreview(mine.logo_url);
      }
    } catch {
      setError('Erro ao carregar dados da congregação.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    setLogoFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = { name };

      if (logoFile) {
        // Converte para base64 e envia ao servidor
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove o prefixo "data:image/...;base64,"
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
        payload.logo_base64 = base64;
        payload.logo_mime = logoFile.type;
      }

      const res = await api.put(`/churches/${church.id}/profile`, payload);
      setSuccess('Perfil atualizado com sucesso!');

      if (res.data.logo_url) {
        setPreview(res.data.logo_url);
      }

      // Atualiza o nome da congregação localmente
      setChurch(prev => prev ? { ...prev, name } : prev);
      setLogoFile(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <Building2 size={40} className="mx-auto mb-3 opacity-40" />
        <p>Congregação não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Editar Perfil</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Personalize o nome e a logo da sua congregação</p>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-medium">
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
            <AlertCircle size={16} /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Logo Upload */}
        <div className="p-6 border-b border-neutral-100">
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Logo da Congregação</label>
          <div className="flex items-start gap-5">
            {/* Preview */}
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-400 bg-neutral-50 hover:bg-emerald-50 flex items-center justify-center cursor-pointer transition-all group flex-shrink-0 overflow-hidden"
            >
              {preview ? (
                <>
                  <img src={preview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <ImagePlus size={22} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-neutral-400 group-hover:text-emerald-500 transition-colors">
                  <ImagePlus size={24} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Foto</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-emerald-300 hover:text-emerald-600 transition-all"
              >
                <Upload size={15} />
                {preview ? 'Alterar logo' : 'Carregar logo'}
              </button>
              <p className="text-xs text-neutral-400">PNG, JPG ou WEBP • Máximo 5 MB</p>
              {logoFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <CheckCircle size={13} /> {logoFile.name}
                  <button type="button" onClick={() => { setLogoFile(null); setPreview(church.logo_url || null); }}
                    className="ml-1 text-neutral-400 hover:text-red-500">
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Nome */}
        <div className="p-6 border-b border-neutral-100">
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
            Nome da Congregação *
          </label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
            placeholder="Nome da congregação..."
          />
        </div>

        {/* Info atual */}
        <div className="px-6 py-4 bg-neutral-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={15} />
          </div>
          <div className="text-xs text-neutral-500">
            <span className="font-semibold text-neutral-700">{church.type}</span>
            {church.sector_name && <> · <span>{church.sector_name}</span></>}
            {church.pastor && <> · <span>{church.pastor}</span></>}
          </div>
        </div>

        {/* Ações */}
        <div className="p-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}
