import React, { useState, useMemo } from 'react';
import api from '../api';
import {
  Sparkles, Copy, Check, ExternalLink, ArrowRight, BookOpen,
  Calendar, CheckCircle, AlertCircle, RefreshCw, FileText,
  HelpCircle, ChevronDown, ChevronUp, Layers, Wand2, ClipboardPaste,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIPromptGeneratorProps {
  onNavigateToLessons?: () => void;
}

export default function MagazineAIGenerator({ onNavigateToLessons }: AIPromptGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'import'>('prompt');
  const [quarter, setQuarter] = useState('3º Trimestre');
  const [year, setYear] = useState('2026');
  const [category, setCategory] = useState('Adultos (Professor) - CPAD');
  const [themeHint, setThemeHint] = useState('');
  const [copied, setCopied] = useState(false);

  const [aiResponse, setAiResponse] = useState('');
  const [parsedData, setParsedData] = useState<{ magazine: any; lessons: any[] } | null>(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  // Gera o Prompt automaticamente com isolamento estrito por faixa etária
  const generatedPrompt = useMemo(() => {
    const categoryInstruction = category.includes('Jovens')
      ? 'Revista Jovens CPAD (Lições Bíblicas Jovens)'
      : category.includes('Juvenis')
      ? 'Revista Juvenis CPAD (Lições Bíblicas Juvenis)'
      : category.includes('Adolescentes')
      ? 'Revista Adolescentes CPAD (Lições Bíblicas Adolescentes)'
      : category.includes('Infantil') || category.includes('Primários')
      ? 'Revista Infantil / Primários / Juniores CPAD'
      : 'Revista Adultos CPAD (Lições Bíblicas Adultos)';

    return `Atue como um especialista em Educação Cristã e Lições Bíblicas da Escola Bíblica Dominical (EBD) da CPAD (Casa Publicadora das Assembleias de Deus).

Pesquise na internet e traga as informações completas oficiais da revista de EBD com os seguintes dados:
- TRIMESTRE: ${quarter}
- ANO: ${year}
- CLASSE / FAIXA ETÁRIA: ${category}
- PUBLICAÇÃO ALVO DA CPAD: ${categoryInstruction}
${themeHint.trim() ? `- TEMA / COMENTARISTA (REFERÊNCIA INFORMADA): ${themeHint.trim()}` : `- TEMA: Localize o tema oficial específico da revista da CPAD para ${category} neste ${quarter} de ${year}`}

⚠️ ATENÇÃO E DIRETRIZ OBRIGATÓRIA:
- Traga as 13 lições EXCLUSIVAMENTE da revista oficial da CPAD voltada para a classe "${category}".
- NÃO traga o tema ou as lições de Adultos se a categoria selecionada for "${category}".
- Cada faixa etária da CPAD possui seu próprio tema trimestral, texto áureo e sumário de 13 lições bíblicas.

Por favor, localize o Sumário oficial com as 13 Lições do trimestre para "${category}" e extraia com exatidão:
1. O Tema Geral completo da Revista para ${category}
2. Para cada uma das 13 Lições:
   - Número da Lição (1 a 13)
   - Título da Lição
   - Data do Domingo correspondente (formato AAAA-MM-DD)
   - Texto Áureo (com o versículo na íntegra e a referência bíblica)
   - Verdade Prática (na íntegra)
   - Hinos sugeridos da Harpa Cristã ou Cânticos

IMPORTANTE: Responda ESTRITAMENTE em formato JSON puro (válido), sem textos adicionais antes ou depois, seguindo exatamente esta estrutura:

\`\`\`json
{
  "magazine": {
    "title": "Título Oficial da Revista para ${category}",
    "quarter": "${quarter}",
    "year": ${year}
  },
  "lessons": [
    {
      "number": 1,
      "title": "Título da Lição 1",
      "date": "${year}-07-05",
      "golden_text": "Texto Áureo completo com citação bíblica entre parênteses",
      "practical_truth": "Verdade Prática completa da lição",
      "suggested_hymns": "Hinos ou Cânticos sugeridos"
    }
  ]
}
\`\`\``;
  }, [quarter, year, category, themeHint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleParseAIResponse = (text: string) => {
    setParseError('');
    setSuccessMessage('');
    if (!text.trim()) {
      setParsedData(null);
      return;
    }

    try {
      let cleanText = text.trim();
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }

      const data = JSON.parse(cleanText);

      if (!data.magazine?.title) {
        throw new Error('O JSON não contém "magazine.title".');
      }
      if (!Array.isArray(data.lessons) || data.lessons.length === 0) {
        throw new Error('O JSON não contém uma lista válida de "lessons".');
      }

      setParsedData(data);
    } catch (err: any) {
      setParsedData(null);
      setParseError('Formato JSON inválido: ' + err.message + '. Certifique-se de copiar a resposta completa da IA.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAiResponse(text);
        handleParseAIResponse(text);
      }
    } catch (e) {
      alert('Não foi possível ler da área de transferência automaticamente. Por favor, cole usando Ctrl+V no campo abaixo.');
    }
  };

  const handleLoadSample = () => {
    const sample = {
      magazine: {
        title: "A Igreja dos Gentios: Da Chamada Missionária à Consolidação do Evangelho Entre os Povos",
        quarter: "3º Trimestre",
        year: 2026
      },
      lessons: [
        {
          number: 1,
          title: "O Chamado para os Gentios",
          date: "2026-07-05",
          golden_text: "“E, servindo eles ao Senhor e jejuando, disse o Espírito Santo: Apartai-me a Barnabé e a Saulo para a obra a que os tenho chamado.” (At 13.2)",
          practical_truth: "Quando a igreja ouve o Espírito, o Evangelho avança e vidas são alcançadas para a glória de Deus.",
          suggested_hymns: "Hinos 120, 224"
        },
        {
          number: 2,
          title: "A Porta da Fé se Abre entre os Gentios",
          date: "2026-07-12",
          golden_text: "“E, quando chegaram e reuniram a igreja, relataram quão grandes coisas Deus fizera com eles e como abrira aos gentios a porta da fé.” (At 14.27)",
          practical_truth: "A salvação em Cristo é para todos os povos, sem acepção de pessoas.",
          suggested_hymns: "Hinos 131, 394"
        },
        {
          number: 3,
          title: "A Graça que Alcança Todas as Nações",
          date: "2026-07-19",
          golden_text: "“Porque não me envergonho do evangelho de Cristo, pois é o poder de Deus para salvação de todo aquele que crê; primeiro do judeu e também do grego.” (Rm 1.16)",
          practical_truth: "O exemplo da igreja de Antioquia inspira a juventude atual a ser missionária.",
          suggested_hymns: "Hinos 120, 440"
        }
      ]
    };

    const textSample = JSON.stringify(sample, null, 2);
    setAiResponse(textSample);
    handleParseAIResponse(textSample);
    setActiveTab('import');
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    setParseError('');
    setSuccessMessage('');

    try {
      const res = await api.post('/magazines/import-ai', parsedData);
      setSuccessMessage(res.data.message || 'Revista e lições cadastradas com sucesso!');
      setParsedData(null);
      setAiResponse('');
    } catch (err: any) {
      setParseError(err.response?.data?.error || 'Erro ao importar lições no sistema.');
    } finally {
      setImporting(false);
    }
  };

  const aiLinks = [
    { name: 'ChatGPT', url: 'https://chatgpt.com', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { name: 'Google Gemini', url: 'https://gemini.google.com', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { name: 'Claude', url: 'https://claude.ai', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
    { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { name: 'Perplexity', url: 'https://perplexity.ai', color: 'bg-teal-600 hover:bg-teal-700 text-white' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-emerald-500" />
            Assistente Inteligente EBD
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Gerador de Lições com IA</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Gere prompts automáticos para pesquisar as 13 lições da CPAD em IAs externas e importe para o sistema em 1 clique.
          </p>
        </div>
      </div>

      {/* Navegação por Abas para Acesso Fácil */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-200/60 rounded-2xl w-full sm:w-auto self-start border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'prompt'
              ? 'bg-white text-emerald-800 shadow-sm shadow-black/5'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/40'
          }`}
        >
          <Wand2 size={16} className={activeTab === 'prompt' ? 'text-emerald-600' : 'text-neutral-400'} />
          <span>Passo 1: Gerar Prompt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
            activeTab === 'import'
              ? 'bg-white text-emerald-800 shadow-sm shadow-black/5'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/40'
          }`}
        >
          <Layers size={16} className={activeTab === 'import' ? 'text-emerald-600' : 'text-neutral-400'} />
          <span>Passo 2: Importar Resposta da IA</span>
          {aiResponse && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ABA 1: GERAR PROMPT */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Configuração */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-600" />
                  1. Dados do Trimestre
                </h2>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Trimestre</label>
                  <select
                    value={quarter}
                    onChange={e => setQuarter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  >
                    <option value="1º Trimestre">1º Trimestre (Jan - Mar)</option>
                    <option value="2º Trimestre">2º Trimestre (Abr - Jun)</option>
                    <option value="3º Trimestre">3º Trimestre (Jul - Set)</option>
                    <option value="4º Trimestre">4º Trimestre (Out - Dez)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Ano</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    placeholder="2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Faixa Etária / Revista</label>
                  <select
                    value={category}
                    onChange={e => {
                      setCategory(e.target.value);
                      setThemeHint('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  >
                    <option value="Adultos (Professor) - CPAD">Adultos (Professor) - CPAD</option>
                    <option value="Adultos (Aluno) - CPAD">Adultos (Aluno) - CPAD</option>
                    <option value="Jovens - CPAD">Jovens - CPAD</option>
                    <option value="Juvenis - CPAD">Juvenis - CPAD</option>
                    <option value="Adolescentes - CPAD">Adolescentes - CPAD</option>
                    <option value="Infantil / Primários">Infantil / Primários</option>
                    <option value="Infantil / Juniores">Infantil / Juniores</option>
                    <option value="Maternal / Jardim">Maternal / Jardim de Infância</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Tema / Comentarista (Opcional)
                    </label>
                    {themeHint && (
                      <button
                        type="button"
                        onClick={() => setThemeHint('')}
                        className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                      >
                        Limpar Tema
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={themeHint}
                    onChange={e => setThemeHint(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none placeholder:text-neutral-400"
                    placeholder={
                      category.includes('Jovens')
                        ? "Deixe vazio para a IA buscar ou digite o tema de Jovens"
                        : category.includes('Juvenis')
                        ? "Deixe vazio para a IA buscar ou digite o tema de Juvenis"
                        : category.includes('Adolescentes')
                        ? "Deixe vazio para a IA buscar ou digite o tema de Adolescentes"
                        : "Deixe vazio para a IA buscar ou digite o tema da revista"
                    }
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Deixe em branco para a IA pesquisar automaticamente o tema oficial da CPAD para <strong>{category}</strong>.
                  </p>
                </div>
              </div>

              {/* Atalhos para IAs Externas */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Wand2 size={18} className="text-emerald-600" />
                  2. Abrir IA Externa
                </h2>
                <p className="text-xs text-neutral-500">
                  Copie o prompt ao lado e cole em qualquer uma dessas ferramentas:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {aiLinks.map(ai => (
                    <a
                      key={ai.name}
                      href={ai.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] ${ai.color}`}
                    >
                      <span>{ai.name}</span>
                      <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Prompt Gerado */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <FileText size={18} className="text-emerald-600" />
                    Prompt Gerado (Pronto para copiar)
                  </h2>
                  <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Prompt Copiado!' : 'Copiar Prompt'}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    rows={11}
                    className="w-full p-4 bg-neutral-900 text-emerald-300 font-mono text-xs rounded-2xl border border-neutral-800 leading-relaxed resize-none focus:outline-none custom-scrollbar selection:bg-emerald-500/40 selection:text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                    className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
                  >
                    {showPromptDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showPromptDetails ? 'Ocultar instruções' : 'Como a IA busca?'}
                  </button>

                  <button
                    onClick={handleLoadSample}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    Testar com Exemplo Pronto
                  </button>
                </div>

                {/* Botão de Avançar Direto para Importação */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('import')}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Já gerou a resposta na IA? Ir para Importação</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ABA 2: IMPORTAR RESPOSTA DA IA */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Layers size={22} className="text-emerald-600" />
                Importar Resposta da IA para o Sistema
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Cole abaixo o texto ou JSON gerado pelo ChatGPT, Claude ou Gemini.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <ClipboardPaste size={16} />
              <span>Colar Automaticamente</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-4 text-sm font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                {onNavigateToLessons && (
                  <button
                    onClick={onNavigateToLessons}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm shrink-0"
                  >
                    Ver Lições <ArrowRight size={13} />
                  </button>
                )}
              </motion.div>
            )}

            {parseError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-sm"
              >
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <span>{parseError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea para Colar */}
          <div>
            <textarea
              value={aiResponse}
              onChange={e => {
                setAiResponse(e.target.value);
                handleParseAIResponse(e.target.value);
              }}
              rows={9}
              className="w-full p-4 border border-neutral-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none leading-relaxed transition-all shadow-sm bg-neutral-50/50"
              placeholder="Cole aqui (Ctrl+V) a resposta fornecida pelo ChatGPT, Claude, Gemini, etc..."
            />
          </div>

          {/* Preview das Lições Processadas */}
          {parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2 border-t border-neutral-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Revista Reconhecida:</span>
                  <h3 className="text-base font-bold text-neutral-900 mt-0.5">{parsedData.magazine.title}</h3>
                  <p className="text-xs text-neutral-500">
                    {parsedData.magazine.quarter} de {parsedData.magazine.year} • <strong>{parsedData.lessons.length} Lições identificadas</strong>
                  </p>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {importing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  <span>{importing ? 'Cadastrando no Sistema...' : 'Confirmar e Cadastrar Revista'}</span>
                </button>
              </div>

              {/* Grid com as Lições Extraídas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                {parsedData.lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-neutral-900 border-b border-neutral-200/60 pb-1.5">
                      <span className="text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        Lição {lesson.number}
                      </span>
                      {lesson.date && <span className="text-neutral-400 font-normal">{lesson.date}</span>}
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm leading-snug">{lesson.title}</h4>
                    
                    {lesson.golden_text && (
                      <div className="text-neutral-600">
                        <span className="font-semibold text-neutral-700">Texto Áureo: </span>
                        <span className="italic">{lesson.golden_text}</span>
                      </div>
                    )}

                    {lesson.practical_truth && (
                      <div className="text-neutral-600">
                        <span className="font-semibold text-neutral-700">Verdade Prática: </span>
                        <span>{lesson.practical_truth}</span>
                      </div>
                    )}

                    {lesson.suggested_hymns && (
                      <div className="text-[11px] text-neutral-400">
                        <span>{lesson.suggested_hymns}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
