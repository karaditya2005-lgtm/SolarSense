"""
Model loader singleton for SolarSense ML Microservice.
Loads model and metadata once at process startup.
"""

import json
import os
import joblib
from typing import Tuple, Any, Dict, Optional


class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None

    def __init__(self, version: str = "v1.0.0"):
        self.version = version
        self.model: Any = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load()

    def load(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Check specific version first, then fallback to latest
        model_dir = os.path.join(base_dir, f"models/{self.version}")
        if not os.path.exists(model_dir):
            model_dir = os.path.join(base_dir, "models/latest")

        model_path = os.path.join(model_dir, "model.joblib")
        meta_path = os.path.join(model_dir, "metadata.json")

        if os.path.exists(model_path) and os.path.exists(meta_path):
            try:
                self.model = joblib.load(model_path)
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)
                self.is_loaded = True
                print(f"Successfully loaded model '{self.metadata.get('name')}' version '{self.metadata.get('version')}'")
            except Exception as e:
                print(f"Error loading model from {model_dir}: {e}")
                self.is_loaded = False
        else:
            print(f"Model artifacts not found in {model_dir}")
            self.is_loaded = False

    @classmethod
    def get_instance(cls, version: str = "v1.0.0") -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = ModelRegistry(version=version)
        return cls._instance
