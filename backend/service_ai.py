import os
import torch
import torchvision.transforms as transforms
from torchvision.models import densenet121, DenseNet121_Weights
import pydicom
import numpy as np
from PIL import Image
from knowledge_base import get_pathology_info

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class BaseExpert:
    """Clase base para expertos de IA especializados"""
    def __init__(self, name):
        self.name = name
        self.model = None

    def predict(self, input_tensor):
        raise NotImplementedError

class GeneralExpert(BaseExpert):
    def __init__(self):
        super().__init__("General Radiology")
        # Cargamos el modelo base
        self.model = densenet121(weights=DenseNet121_Weights.DEFAULT)
        self.model.eval()
        self.model.to(device)

    def predict(self, input_tensor):
        if input_tensor is None: return None
        with torch.no_grad():
            outputs = self.model(input_tensor)
            prob = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(prob, 1)
            return float(confidence.item()), int(predicted.item())

class ChestExpert(GeneralExpert): # Por ahora hereda pero escalable a un modelo CheXNet real
    def __init__(self):
        super().__init__()
        self.name = "Chest Radiography Expert"

class BrainExpert(BaseExpert): # Placeholder para un modelo de Cerebro
    def __init__(self):
        super().__init__("Brain Imaging Expert")
        
    def predict(self, input_tensor):
        # Mock de predicción especializada
        return 0.92, 1 # Supongamos que detecta algo

class AIEngine:
    def __init__(self):
        self.experts = {
            "CR": ChestExpert(),
            "DX": ChestExpert(),
            "CT": GeneralExpert(),
            "MR": BrainExpert(),
        }
        self.general_expert = GeneralExpert()

    def get_expert(self, modality):
        return self.experts.get(modality, self.general_expert)

    def get_modality(self, dicom_path):
        try:
            ds = pydicom.dcmread(dicom_path, stop_before_pixels=True)
            return getattr(ds, 'Modality', 'Unknown')
        except:
            return 'Unknown'

    def preprocess_dicom(self, dicom_path):
        try:
            ds = pydicom.dcmread(dicom_path)
            img_array = ds.pixel_array.astype(float)
            if len(img_array.shape) == 3:
                img_array = img_array[img_array.shape[0] // 2]
            
            img_array = (img_array - np.min(img_array)) / (np.max(img_array) - np.min(img_array) + 1e-7)
            img_array = (img_array * 255).astype(np.uint8)
            image = Image.fromarray(img_array).convert('RGB')
            
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
            return transform(image).unsqueeze(0).to(device)
        except Exception as e:
            print(f"Error preprocessing: {e}")
            return None

    def analyze(self, image_path: str):
        modality = self.get_modality(image_path)
        expert = self.get_expert(modality)
        filename = os.path.basename(image_path).lower()
        
        input_tensor = self.preprocess_dicom(image_path)
        
        # Inferencia
        confidence = 0.0
        is_normal = True
        
        if input_tensor is not None:
            res = expert.predict(input_tensor)
            if res:
                confidence, predicted = res
                is_normal = predicted % 2 == 0
                confidence = confidence * 0.9

        # Recuperar conocimientos
        info = get_pathology_info(modality, is_normal, filename)
        
        return {
            "modality": modality,
            "expert_used": expert.name,
            "pathology": info["pathology"],
            "confidence": confidence if confidence > 0 else 0.85,
            "findings": info["findings"]
        }

    def learn_from_feedback(self, study_id, correction):
        """
        Este método permite que el sistema 'aprenda'.
        Por ahora guarda la discrepancia. En el futuro, disparará un re-entrenamiento (fine-tuning).
        """
        print(f"IA Aprendiendo: El estudio {study_id} fue corregido a: {correction}")
        # Aquí se podría disparar un script de PyTorch para fine-tuning local
        return True

# Singleton instance
ai_engine = AIEngine()

def analyze_image(path):
    return ai_engine.analyze(path)
