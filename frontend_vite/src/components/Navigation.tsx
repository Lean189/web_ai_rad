import { Activity } from "lucide-react";
import { View } from "../types";

interface NavigationProps {
    currentView: View;
    setView: (view: View) => void;
}

export const Navigation = ({ currentView, setView }: NavigationProps) => {
    return (
        <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView("upload")}>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">
                        RadAI <span className="text-blue-500">Rx</span>
                    </span>
                </div>
                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setView("upload")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === "upload"
                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        Nuevo Estudio
                    </button>
                    <button
                        onClick={() => setView("history")}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === "history"
                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        Historial
                    </button>
                </div>
            </div>
        </nav>
    );
};
