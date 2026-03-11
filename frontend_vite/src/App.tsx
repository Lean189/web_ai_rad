import { useState, useEffect, useCallback } from "react";
import { Study, View } from "./types";
import { studyService } from "./services/api";
import { Navigation } from "./components/Navigation";
import { UploadSection } from "./components/UploadSection";
import { HistoryList } from "./components/HistoryList";
import { StudyViewer } from "./components/StudyViewer";

export default function App() {
    const [files, setFiles] = useState<File[]>([]);
    const [studies, setStudies] = useState<Study[]>([]);
    const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
    const [selectedStack, setSelectedStack] = useState<Study[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [view, setView] = useState<View>("upload");

    const fetchHistory = useCallback(async () => {
        try {
            const history = await studyService.getHistory();
            setStudies(history);
        } catch (e) {
            console.error("Error fetching history", e);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleUpload = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setUploadProgress(0);
        try {
            const processedBatch = await studyService.processStudy(files, (p) => {
                setUploadProgress(p);
            });

            if (processedBatch.length > 0) {
                setSelectedStack(processedBatch);
                setSelectedStudy(processedBatch[0]);
                setView("viewer");
            }
            fetchHistory();
        } catch (e) {
            console.error(e);
            alert("Error procesando los archivos.");
        } finally {
            setLoading(false);
            setUploadProgress(0);
            setFiles([]);
        }
    };

    const handleSelectStudy = (study: Study, stack: Study[] = []) => {
        // Find all studies of the same batch/type if not provided
        const fullStack = stack.length > 0 ? stack : studies.filter(s => s.study_type === study.study_type);
        setSelectedStack(fullStack);
        setSelectedStudy(study);
        setView("viewer");
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
            <Navigation currentView={view} setView={setView} />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {view === "upload" && (
                    <UploadSection
                        files={files}
                        setFiles={setFiles}
                        handleUpload={handleUpload}
                        loading={loading}
                        progress={uploadProgress}
                    />
                )}

                {view === "history" && (
                    <HistoryList
                        studies={studies}
                        onSelect={handleSelectStudy}
                    />
                )}

                {view === "viewer" && selectedStudy && (
                    <StudyViewer study={selectedStudy} stack={selectedStack} />
                )}
            </main>
        </div>
    );
}
