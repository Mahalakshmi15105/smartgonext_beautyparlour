from flask import jsonify
from datetime import datetime, timezone

def success_response(data=None, status_code=200):
    response = {
        "success": True
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code

def error_response(error_code, message, status_code=400, errors=None):
    response = {
        "success": False,
        "error_code": error_code,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if errors is not None:
        response["errors"] = errors
    return jsonify(response), status_code
