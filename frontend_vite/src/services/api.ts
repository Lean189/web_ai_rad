import axios from "axios";
import { Study } from "../types";

const API_BASE = "/api";

const api = axios.create({
    baseURL: API_BASE,
});

export const studyService = {
    getHistory: async (): Promise<Study[]> => {
        const res = await api.get("/history");
        return res.data;
    },

    processStudy: async (files: File[], onProgress?: (p: number) => void): Promise<Study[]> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("files", file);
        });
        const res = await api.post("/process-study", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return res.data;
    },

    saveFeedback: async (studyId: number, correction: string, notes: string) => {
        const res = await api.post("/feedback", null, {
            params: {
                study_id: studyId,
                expert_correction: correction,
                notes: notes
            }
        });
        return res.data;
    },

    verifyStudy: async (studyId: number) => {
        const res = await api.post(`/verify/${studyId}`);
        return res.data;
    },

    getImageUrl: (path: string) => {
        const normalizedPath = path.replace(/\\/g, '/');
        const filename = normalizedPath.split('/').pop();
        return `${window.location.origin}${API_BASE}/images/${filename}`;
    },
};
