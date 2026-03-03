import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_report(pathology: str, findings: str):
    """
    Generates a structured radiology report using a local LLM (Ollama).
    """
    prompt = f"""
    You are a professional radiologist assistant. Write a structured radiology report based on these findings:
    Pathology: {pathology}
    Findings: {findings}
    
    Format:
    - CLINICAL HISTORY: (Leave blank)
    - COMPARISON: (Leave blank)
    - TECHNIQUE: (Describe a standard examination for this pathology)
    - FINDINGS: {findings}
    - IMPRESSION: {pathology}
    
    Keep it concise and professional.
    """
    
    try:
        # Note: This assumes Ollama is running locally with llama3
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json().get("response", "Error generating report.")
        else:
            return f"LLM Error: Unable to generate report (Code {response.status_code})"
    except Exception as e:
        return f"Local LLM Error: {str(e)}. (Make sure Ollama is running with llama3)"

# Mock version for testing if Ollama isn't available
def get_mock_report(pathology: str, findings: str):
    return f"""
    RADIOLOGY REPORT (AI-Generated Draft)
    --------------------------------------
    FINDINGS: {findings}
    IMPRESSION: Findings are consistent with {pathology}.
    
    Note: This is an automated draft. Validation by a radiologist is required.
    """
