/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, Loader2, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeImage } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setMimeType(file.type);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const promptResult = await analyzeImage(image, mimeType);
      setResult(promptResult || 'Não foi possível gerar o prompt.');
    } catch (error) {
      console.error(error);
      setResult('Erro ao analisar imagem. Verifique sua conexão.');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    // Tenta extrair apenas o bloco de código se houver
    const codeMatch = result.match(/```(?:prompt|text|markdown)?\n([\s\S]*?)\n```/);
    const textToCopy = codeMatch ? codeMatch[1] : result;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-white/5 py-6 px-8 flex items-center justify-between glass sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10">
              <Sparkles className="text-cyan-400 w-7 h-7" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Prompt<span className="text-cyan-400">Cloner</span>
            </h1>
            <p className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-[0.3em] font-bold">Neural Image Analysis v2.0</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div> Sistema Online</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Gemini 3.1 Pro</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Column: Upload & Preview */}
        <section className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Clonagem <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Instantânea</span>
            </h2>
            <p className="text-zinc-400 text-lg font-light max-w-md">
              Carregue qualquer imagem visual para criar prompt de alta precisão idêntico da imagem original.
            </p>
          </div>

          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => !image && fileInputRef.current?.click()}
            className={cn(
              "relative aspect-[4/3] rounded-[2rem] border-2 transition-all duration-700 flex flex-col items-center justify-center overflow-hidden group cursor-pointer",
              image 
                ? "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]" 
                : "border-white/5 hover:border-cyan-500/30 bg-zinc-900/30 backdrop-blur-sm"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <AnimatePresence mode="wait">
              {image ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative scanline"
                >
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-8">
                    <button 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
                    >
                      <RefreshCw size={16} className="text-cyan-400" />
                      Trocar Imagem
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6 text-zinc-500"
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors"></div>
                    <Upload size={48} className="relative text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-white uppercase tracking-[0.2em] text-sm">Envie sua Imagem</p>
                    <p className="text-xs font-mono">Arraste ou clique para enviar</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            disabled={!image || analyzing}
            onClick={handleAnalyze}
            className={cn(
              "w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-4 transition-all relative overflow-hidden group",
              image && !analyzing 
                ? "bg-cyan-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(6,182,212,0.4)]" 
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
            )}
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processando Redes Neurais...
              </>
            ) : (
              <>
                Solicitar prompt
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
            {image && !analyzing && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
            )}
          </button>
        </section>

        {/* Right Column: Results */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] font-bold text-zinc-400">Terminal de Saída</h3>
            </div>
            {result && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar Prompt'}
              </button>
            )}
          </div>

          <div className="min-h-[500px] glass rounded-[2.5rem] p-10 relative overflow-hidden border border-white/5">
            <AnimatePresence mode="wait">
              {!result && !analyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-12 text-center"
                >
                  <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mb-6">
                    <ImageIcon size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm font-mono uppercase tracking-widest opacity-40">Aguardando entrada de dados...</p>
                </motion.div>
              )}

              {analyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10"
                >
                  <div className="relative scale-125">
                    <div className="w-24 h-24 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-2 border-purple-500/10 border-b-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 w-8 h-8 animate-pulse" />
                  </div>
                  <div className="mt-12 space-y-2 text-center">
                    <p className="text-cyan-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Analisando Vetores</p>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Extraindo metadados visuais...</p>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="markdown-body h-full overflow-y-auto pr-4 custom-scrollbar"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 flex gap-5 items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full"></div>
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Sparkles className="text-cyan-400 w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Protocolo de Uso</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Para resultados idênticos, utilize o prompt gerado em geradores de imagem de última geração como <span className="text-zinc-300">Midjourney v6</span> ou <span className="text-zinc-300">DALL-E 3</span>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">© 2026 PromptCloner AI • Neural Engine v2.0</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}} />
    </div>
  );
}
