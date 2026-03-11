import { Upload, ChevronRight } from "lucide-react";

interface UploadSectionProps {
    files: File[];
    setFiles: (files: File[]) => void;
    handleUpload: () => void;
    loading: boolean;
    progress: number;
}

export const UploadSection = ({ files, setFiles, handleUpload, loading, progress }: UploadSectionProps) => {
    return (
        <div className="max-w-3xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16">
                <h1 className="text-6xl font-black mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent tracking-tight">
                    Análisis Inteligente de Imágenes Médicas
                </h1>
                <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                    Detección avanzada para Rayos X, Tomografías y Resonancias Magnéticas potenciada por IA.
                </p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative border border-white/10 rounded-[2rem] p-12 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center gap-6 shadow-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-all duration-500">
                        <Upload className="text-blue-500 w-8 h-8" />
                    </div>

                    <div className="flex gap-4 w-full max-w-md">
                        <label className="flex-1 cursor-pointer bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-white/5 text-center transition-all group/opt">
                            <input
                                type="file"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                className="hidden"
                                multiple
                            />
                            <span className="block font-bold text-sm text-slate-300 group-hover/opt:text-blue-400">Archivos sueltos</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black">JPG, PNG, DCM</span>
                        </label>

                        <label className="flex-1 cursor-pointer bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl border border-white/5 text-center transition-all group/opt">
                            <input
                                type="file"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                className="hidden"
                                {...({ webkitdirectory: "", directory: "" } as any)}
                            />
                            <span className="block font-bold text-sm text-slate-300 group-hover/opt:text-blue-400">Carpeta Completa</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black">CT / MRI Series</span>
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="text-center animate-in fade-in slide-in-from-top-2 w-full max-w-lg">
                            <span className="text-2xl font-black text-blue-400 block mb-1">
                                {files.length} elementos listos
                            </span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Se procesarán como un solo estudio</p>

                            {loading && (
                                <div className="space-y-2">
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black italic text-blue-500 uppercase tracking-tighter">
                                        {progress < 100 ? `Subiendo datos: ${progress}%` : 'Finalizando análisis con IA...'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {files.length > 0 && (
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="group/btn relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl shadow-blue-500/40 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{progress < 100 ? 'Subiendo...' : 'Procesando IA...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Procesamiento Masivo</span>
                                    <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-16">
                {[
                    { label: "Modality Support", value: "RX, CT, MRI" },
                    { label: "Processing Time", value: "< 2 Seconds" },
                    { label: "Anonymization", value: "Local HIPAA" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-white font-black text-lg">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-center">
                <p className="text-sm text-slate-400 leading-relaxed">
                    <span className="font-bold text-blue-400">🛡️ Nota de Privacidad:</span> Los archivos DICOM son **anonimizados automáticamente en este equipo** antes de ser procesados. Los datos sensibles del paciente (Nombre, ID, Institución) nunca salen de su entorno local.
                </p>
            </div>
        </div>
    );
};
