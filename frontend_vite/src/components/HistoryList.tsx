import { History, FileText, ChevronRight, Activity, Calendar, Layers } from "lucide-react";
import { Study } from "../types";

interface HistoryListProps {
    studies: Study[];
    onSelect: (study: Study, stack: Study[]) => void;
}

export const HistoryList = ({ studies, onSelect }: HistoryListProps) => {
    const grouped = studies.reduce((acc, current) => {
        const key = current.study_type !== "General" ? current.study_type : `single-${current.id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(current);
        return acc;
    }, {} as Record<string, Study[]>);

    const groupList = Object.values(grouped);

    return (
        <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Pro */}
            <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 text-blue-500 mb-2">
                        <History size={20} className="animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Archive System</span>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter">
                        Estudios <span className="text-slate-500">Recientes</span>
                    </h2>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Index count</span>
                    <div className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20 font-mono text-xs font-bold">
                        {groupList.length.toString().padStart(2, '0')} UNITS
                    </div>
                </div>
            </div>

            {/* List Container */}
            <div className="space-y-3">
                {groupList.map((stack) => {
                    const s = stack[0];
                    const isStack = stack.length > 1;

                    return (
                        <div
                            key={s.id}
                            onClick={() => onSelect(s, stack)}
                            className="group relative flex items-center justify-between p-1 pr-6 bg-slate-900/20 hover:bg-slate-800/40 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                        >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="flex items-center gap-6 relative z-10">
                                {/* Icon Wrapper */}
                                <div className={`w-16 h-16 flex items-center justify-center rounded-xl transition-all duration-500 ${isStack ? 'bg-blue-600/10' : 'bg-slate-800/50'} group-hover:scale-95`}>
                                    {isStack ? (
                                        <Layers className="text-blue-500 w-6 h-6" />
                                    ) : (
                                        <FileText className="text-slate-500 group-hover:text-blue-400 w-6 h-6" />
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-sm font-black text-white/90 tracking-tight group-hover:text-white">
                                            {isStack ? `SERIE DICOM ACCUMULATION` : s.filename.toUpperCase()}
                                        </h4>
                                        {isStack && (
                                            <span className="bg-blue-600 text-[9px] font-black px-2 py-0.5 rounded-md">
                                                {stack.length} SLICES
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-400/80 uppercase tracking-widest">
                                            <Activity size={10} />
                                            {s.modality || "CT SCAN"}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                            <Calendar size={10} />
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Result */}
                            <div className="flex items-center gap-12 relative z-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mb-1">Diagnosis</p>
                                    <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                        {s.pathology_detected || "Sin hallazgos"}
                                    </p>
                                </div>

                                <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:rotate-45 transition-all duration-500">
                                    <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State Pro */}
                {groupList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-900/10 border border-dashed border-white/5 rounded-[3rem]">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <History className="text-slate-700 w-10 h-10" />
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">No active records found</p>
                        <p className="text-slate-700 text-[10px] mt-2 font-bold uppercase tracking-widest italic">Waiting for initial data ingestion...</p>
                    </div>
                )}
            </div>
        </div>
    );
};