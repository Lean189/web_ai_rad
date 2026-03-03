import { History, FileText, ChevronRight, Activity } from "lucide-react";
import { Study } from "../types";

interface HistoryListProps {
    studies: Study[];
    onSelect: (study: Study) => void;
}

export const HistoryList = ({ studies, onSelect }: HistoryListProps) => {
    return (
        <div className="py-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-black flex items-center gap-4">
                        <History className="text-blue-500 w-10 h-10" />
                        Estudios Recientes
                    </h2>
                    <p className="text-slate-400 mt-2 font-medium">Historial de diagnósticos y reportes generados.</p>
                </div>
                <div className="bg-blue-600/10 text-blue-500 px-4 py-2 rounded-xl border border-blue-500/20 font-bold text-sm">
                    {studies.length} Estudios Totales
                </div>
            </div>

            <div className="grid gap-4">
                {studies.map((s) => (
                    <div
                        key={s.id}
                        className="group bg-slate-900/40 border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between hover:bg-slate-900 hover:border-blue-500/30 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/5"
                        onClick={() => onSelect(s)}
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                                <FileText className="text-slate-400 group-hover:text-blue-500 w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold group-hover:text-white transition-colors">{s.filename}</h4>
                                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mt-1">
                                    <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-wider text-slate-400">
                                        {s.modality || "Unknown"}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                                    <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                    <Activity size={14} className="text-green-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-green-500/80">
                                        {s.status}
                                    </span>
                                </div>
                                <p className="text-lg font-black text-white">{s.pathology_detected}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={20} className="text-slate-600 group-hover:text-white" />
                            </div>
                        </div>
                    </div>
                ))}

                {studies.length === 0 && (
                    <div className="text-center py-24 bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem]">
                        <p className="text-slate-500 font-bold italic text-lg text-center">No hay estudios en el historial.</p>
                        <p className="text-slate-600 text-sm mt-2">Sube tu primer estudio para comenzar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
