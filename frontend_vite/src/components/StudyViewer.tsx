import { CheckCircle, FileText, Activity, Brain } from "lucide-react";
import DicomViewer from "./DicomViewer";
import { Study } from "../types";
import { studyService } from "../services/api";

interface StudyViewerProps {
    study: Study;
    stack?: Study[];
}

export const StudyViewer = ({ study, stack = [] }: StudyViewerProps) => {
    // Si hay un stack, usamos todos sus path, si no, solo el del estudio seleccionado
    const imageUrls = stack.length > 0
        ? stack.map(s => studyService.getImageUrl(s.anonymized_path))
        : [studyService.getImageUrl(study.anonymized_path)];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)] animate-in fade-in zoom-in-95 duration-700">
            {/* Image Section */}
            <div className="lg:col-span-8 bg-black rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl flex flex-col">
                <DicomViewer imageUrls={imageUrls} study={study} />
            </div>

            {/* Panel Section */}
            <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-2xl shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-black flex items-center gap-3 text-blue-400">
                            <Brain className="w-6 h-6" /> Resultado AI
                        </h3>
                        {study.is_verified && (
                            <span className="bg-green-500/20 text-green-400 text-[10px] px-3 py-1 rounded-full font-black flex items-center gap-1 border border-green-500/30">
                                <CheckCircle size={10} /> VERIFICADO
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Diagnóstico Presuntivo</p>
                            <p className="text-2xl font-black text-white leading-tight">{study.pathology_detected}</p>
                        </div>
                        <div className="p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-end mb-3">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Confianza AI</p>
                                <span className="font-mono font-black text-blue-400 text-lg">{(study.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${study.confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Centro de Enseñanza */}
                <div className="bg-blue-600/10 backdrop-blur-md border border-blue-500/20 p-8 rounded-[2rem] shadow-2xl shrink-0">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-indigo-400">
                        <Activity className="w-6 h-6" /> Centro de Enseñanza
                    </h3>
                    {!study.is_verified ? (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                Como facultativo, su validación es crucial para que la IA aprenda. Si el diagnóstico es correcto, confírmelo. De lo contrario, proporcione la corrección.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => studyService.verifyStudy(study.id).then(() => window.location.reload())}
                                    className="py-4 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => {
                                        const corr = prompt("Ingrese el diagnóstico correcto:");
                                        if (corr) studyService.saveFeedback(study.id, corr, "Corrección manual").then(() => window.location.reload());
                                    }}
                                    className="py-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Corregir
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <p className="text-xs font-bold text-indigo-300">✓ Conocimiento Integrado</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] shadow-2xl flex-1 flex flex-col min-h-[400px] shrink-0">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400">
                        <FileText className="w-6 h-6" /> Borrador del Informe
                    </h3>
                    <div className="flex-1 relative mb-6">
                        <textarea
                            className="w-full h-full bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none leading-relaxed custom-scrollbar"
                            defaultValue={study.ai_report_draft}
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
