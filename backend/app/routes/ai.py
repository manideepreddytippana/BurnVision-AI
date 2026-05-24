import json
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models import (
    AdvancedCaloriePrediction,
    AdvancedCaloriePredictionExplanation,
    CaloriePrediction,
    CaloriePredictionExplanation,
)
from app.services.sarvam_ai_service import get_sarvam_ai_service

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/evaluate", methods=["POST"])
@jwt_required()
def evaluate_prediction():
    """Evaluate a calorie prediction with Sarvam AI and persist the structured insights."""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        prediction_id = data.get("prediction_id")
        if not prediction_id:
            return jsonify({"error": "prediction_id is required"}), 400

        prediction = CaloriePrediction.query.filter_by(
            id=int(prediction_id), user_id=user_id
        ).first()
        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404

        evaluation_input = {
            "gender": prediction.gender,
            "age": prediction.age,
            "height": prediction.height,
            "weight": prediction.weight,
            "duration": prediction.duration,
            "heart_rate": prediction.heart_rate,
            "body_temp": prediction.body_temp,
            "predicted_calories": prediction.predicted_calories,
            "confidence_score": prediction.confidence_score,
            "model_type": prediction.model_type,
            "derived_metrics": prediction.derived_metrics or {},
        }

        sarvam_result = get_sarvam_ai_service().evaluate_prediction(evaluation_input)

        ai_payload = {
            "provider": "sarvam-ai",
            "model": sarvam_result.get("model"),
            "generated_at": datetime.utcnow().isoformat(),
            "success": sarvam_result.get("success", False),
            "structured": sarvam_result.get("structured", {}),
            "raw_text": sarvam_result.get("raw_text", ""),
            "error": sarvam_result.get("error"),
        }

        main_prediction_data = {
            "prediction_id": prediction.id,
            "prediction_type": "standard",
            "predicted_calories": prediction.predicted_calories,
            "confidence_score": prediction.confidence_score,
            "model_type": prediction.model_type,
            "gender": prediction.gender,
            "age": prediction.age,
            "height": prediction.height,
            "weight": prediction.weight,
            "duration": prediction.duration,
            "heart_rate": prediction.heart_rate,
            "body_temp": prediction.body_temp,
            "derived_metrics": prediction.derived_metrics or {},
            "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
        }

        explanation_row = CaloriePredictionExplanation.query.filter_by(
            prediction_id=prediction.id,
            user_id=user_id,
        ).first()
        if not explanation_row:
            explanation_row = CaloriePredictionExplanation(
                prediction_id=prediction.id,
                user_id=user_id,
                main_prediction_data=main_prediction_data,
                ai_insights=ai_payload,
            )
            db.session.add(explanation_row)
        else:
            explanation_row.main_prediction_data = main_prediction_data
            explanation_row.ai_insights = ai_payload

        prediction.recommendation = json.dumps(ai_payload, ensure_ascii=True)
        db.session.commit()

        return jsonify({
            "prediction_id": prediction.id,
            "ai_insights": ai_payload,
        }), 200

    except ValueError:
        return jsonify({"error": "prediction_id must be a valid integer"}), 400
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


@ai_bp.route("/advanced-evaluate", methods=["POST"])
@jwt_required()
def evaluate_advanced_prediction():
    """Evaluate an advanced calorie prediction with Sarvam AI and persist the structured insights."""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        prediction_id = data.get("prediction_id")
        if not prediction_id:
            return jsonify({"error": "prediction_id is required"}), 400

        prediction = AdvancedCaloriePrediction.query.filter_by(
            id=int(prediction_id), user_id=user_id
        ).first()
        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404

        evaluation_input = {
            "prediction_type": "advanced",
            "gender": prediction.gender,
            "age": prediction.age,
            "weight": prediction.weight,
            "height": prediction.height,
            "resting_heart_rate": prediction.resting_heart_rate,
            "avg_heart_rate": prediction.avg_heart_rate,
            "workout_type": prediction.workout_type,
            "exercise_name": prediction.exercise_name,
            "session_duration": prediction.session_duration,
            "sets": prediction.sets,
            "reps": prediction.reps,
            "difficulty_level": prediction.difficulty_level,
            "experience_level": prediction.experience_level,
            "water_intake": prediction.water_intake,
            "workout_frequency": prediction.workout_frequency,
            "predicted_calories": prediction.predicted_calories,
            "confidence_score": prediction.confidence_score,
            "model_type": prediction.model_type,
            "derived_metrics": prediction.derived_metrics or {},
        }

        sarvam_result = get_sarvam_ai_service().evaluate_prediction(evaluation_input)

        ai_payload = {
            "provider": "sarvam-ai",
            "model": sarvam_result.get("model"),
            "generated_at": datetime.utcnow().isoformat(),
            "success": sarvam_result.get("success", False),
            "structured": sarvam_result.get("structured", {}),
            "raw_text": sarvam_result.get("raw_text", ""),
            "error": sarvam_result.get("error"),
        }

        main_prediction_data = {
            "prediction_id": prediction.id,
            "prediction_type": "advanced",
            "predicted_calories": prediction.predicted_calories,
            "confidence_score": prediction.confidence_score,
            "model_type": prediction.model_type,
            "gender": prediction.gender,
            "age": prediction.age,
            "height": prediction.height,
            "weight": prediction.weight,
            "duration": prediction.session_duration,
            "heart_rate": prediction.avg_heart_rate,
            "body_temp": None,
            "workout_type": prediction.workout_type,
            "exercise_name": prediction.exercise_name,
            "derived_metrics": prediction.derived_metrics or {},
            "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
        }

        explanation_row = AdvancedCaloriePredictionExplanation.query.filter_by(
            prediction_id=prediction.id,
            user_id=user_id,
        ).first()
        if not explanation_row:
            explanation_row = AdvancedCaloriePredictionExplanation(
                prediction_id=prediction.id,
                user_id=user_id,
                main_prediction_data=main_prediction_data,
                ai_insights=ai_payload,
            )
            db.session.add(explanation_row)
        else:
            explanation_row.main_prediction_data = main_prediction_data
            explanation_row.ai_insights = ai_payload

        prediction.recommendation = json.dumps(ai_payload, ensure_ascii=True)
        db.session.commit()

        return jsonify({
            "prediction_id": prediction.id,
            "ai_insights": ai_payload,
        }), 200

    except ValueError:
        return jsonify({"error": "prediction_id must be a valid integer"}), 400
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


@ai_bp.route("/prediction-insights", methods=["GET"])
@jwt_required()
def get_prediction_insights():
    """Return all persisted Sarvam insights paired with main prediction card data."""
    try:
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 100, type=int)

        results = (
            CaloriePredictionExplanation.query.filter_by(user_id=user_id)
            .order_by(CaloriePredictionExplanation.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return jsonify(
            {
                "insights": [row.to_dict() for row in results.items],
                "total": results.total,
                "pages": results.pages,
                "current_page": page,
            }
        ), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@ai_bp.route("/advanced-prediction-insights", methods=["GET"])
@jwt_required()
def get_advanced_prediction_insights():
    """Return all persisted Sarvam insights paired with advanced prediction card data."""
    try:
        user_id = int(get_jwt_identity())
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 100, type=int)

        results = (
            AdvancedCaloriePredictionExplanation.query.filter_by(user_id=user_id)
            .order_by(AdvancedCaloriePredictionExplanation.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return jsonify(
            {
                "insights": [row.to_dict() for row in results.items],
                "total": results.total,
                "pages": results.pages,
                "current_page": page,
            }
        ), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
