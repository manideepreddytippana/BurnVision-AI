import json
import os
import re
from typing import Any, Dict, List

import requests

class SarvamAIService:

    ENDPOINT = "https://api.sarvam.ai/v1/chat/completions"
    DEFAULT_MODEL = "sarvam-105b"

    def __init__(self):
        from flask import current_app
        self.api_key = current_app.config["SARVAM_API_KEY"]
        self.model = current_app.config["SARVAM_AI_MODEL"]
        self.timeout = current_app.config["SARVAM_AI_TIMEOUT"]

    @staticmethod
    def _empty_structured() -> Dict[str, Any]:
        return {
            "workout_anomalies": [],
            "behavioral_anomalies": [],
            "overtraining_detection": [],
            "nutrition_recommendations": [],
            "hydration_tracking": [],
            "progress_tracking": [],
            "smart_recommendation_engine": [],
            "personalization_factor": "No personalization signals were detected yet.",
        }

    @staticmethod
    def _sanitize_list(value: Any) -> List[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _normalize_structured(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        structured = self._empty_structured()
        if not isinstance(parsed, dict):
            return structured

        for key in (
            "workout_anomalies",
            "behavioral_anomalies",
            "overtraining_detection",
            "nutrition_recommendations",
            "hydration_tracking",
            "progress_tracking",
            "smart_recommendation_engine",
        ):
            structured[key] = self._sanitize_list(parsed.get(key))

        personalization_factor = parsed.get("personalization_factor")
        if personalization_factor:
            structured["personalization_factor"] = str(personalization_factor).strip()

        return structured

    @staticmethod
    def _extract_first_json_object(text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        if text.startswith("{") and text.endswith("}"):
            return text

        match = re.search(r"\{[\s\S]*\}", text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_content(response_data: Dict[str, Any]) -> str:
        choices = response_data.get("choices") or []
        if not choices:
            return ""

        message = choices[0].get("message") or {}
        return str(message.get("content") or "")

    def _build_prompt_payload(self, input_payload: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You are an expert fitness and nutrition coach. Analyze the provided workout and calorie "
            "prediction data and produce strict JSON output only. Do not include markdown, headings, "
            "or extra text. Use this exact schema: "
            "{"
            '\"workout_anomalies\": string[], '
            '\"behavioral_anomalies\": string[], '
            '\"overtraining_detection\": string[], '
            '\"nutrition_recommendations\": string[], '
            '\"hydration_tracking\": string[], '
            '\"progress_tracking\": string[], '
            '\"smart_recommendation_engine\": string[], '
            '\"personalization_factor\": string'
            "}. Keep each list concise and actionable."
        )

        user_prompt = "Input Data: " + json.dumps(input_payload, ensure_ascii=True)

        return {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
        }

    def evaluate_prediction(self, input_payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "success": False,
                "model": self.model,
                "error": "SARVAM_AI_API_KEY is not configured",
                "raw_text": "",
                "structured": self._empty_structured(),
            }

        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }

        request_payload = self._build_prompt_payload(input_payload)

        try:
            response = requests.post(
                self.ENDPOINT,
                headers=headers,
                json=request_payload,
                timeout=self.timeout,
            )
            response.raise_for_status()

            response_data = response.json()
            content = self._extract_content(response_data)

            json_text = self._extract_first_json_object(content)
            parsed = json.loads(json_text) if json_text else {}
            structured = self._normalize_structured(parsed)

            return {
                "success": True,
                "model": self.model,
                "error": None,
                "raw_text": content,
                "structured": structured,
            }
        except (requests.RequestException, json.JSONDecodeError, ValueError) as exc:
            return {
                "success": False,
                "model": self.model,
                "error": "Failed to connect to AI service.",
                "raw_text": "",
                "structured": self._empty_structured(),
            }
def get_sarvam_ai_service() -> SarvamAIService:
    return SarvamAIService()
