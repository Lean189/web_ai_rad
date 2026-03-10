import { Upload, ChevronRight } from "lucide-react";

interface UploadSectionProps {
    files: File[];
    setFiles: (files: File[]) => void;
    handleUpload: () => void;
    loading: boolean;
}

export const UploadSection = ({ files, setFiles, handleUpload, loading }: UploadSectionProps) => {
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
                <div className="relative border border-white/10 rounded-[2rem] p-16 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center gap-8 shadow-2xl">
                    <div className="w-24 h-24 rounded-3xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Upload className="text-blue-500 w-10 h-10" />
                    </div>

                    <input
                        type="file"
                        onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);
                            // Filtrar solo archivos (evitar carpetas vacías si el navegador las permite)
                            const filesOnly = selectedFiles.filter(f => f.size > 0);
                            setFiles(filesOnly);
                        }}
                        className="hidden"
                        id="file-upload"
                        {...({ webkitdirectory: "", directory: "" } as any)}
                        multiple
                    />

                    <label htmlFor="file-upload" className="cursor-pointer text-center">
                        <span className="text-3xl font-bold block mb-2 transition-colors group-hover:text-blue-400">
                            {files.length > 0
                                ? `${files.length} archivos seleccionados`
                                : "Subir carpeta o archivos"}
                        </span>
                        <p className="text-slate-500 font-medium">DICOM, carpetas completas, JPG o PNG</p>
                    </label>

                    {files.length > 0 && (
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="group/btn relative px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl shadow-blue-500/40 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Procesando {files.length} archivos...</span>
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
