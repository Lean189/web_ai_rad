export interface Study {
    id: number;
    filename: string;
    modality: string;
    original_path: string;
    anonymized_path: string;
    status: string;
    pathology_detected: string;
    confidence: number;
    ai_report_draft: string;
    final_report: string;
    study_type: string;
    is_verified: boolean;
    created_at: string;
}

export type View = "upload" | "history" | "viewer";
