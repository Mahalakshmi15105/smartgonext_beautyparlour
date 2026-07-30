import os
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g, current_app
from app.database import db
from app.models.whatsapp import WhatsAppSetting, WhatsAppLog
from app.services.whatsapp_service import WhatsAppService
from app.utils.auth import require_role, get_tenant_query
from app.utils.responses import success_response, error_response

logger = logging.getLogger(__name__)

whatsapp_bp = Blueprint("whatsapp", __name__)


@whatsapp_bp.route("/whatsapp/settings", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_whatsapp_settings():
    """Returns Meta WhatsApp Business account connection details for the logged-in parlour tenant."""
    setting = get_tenant_query(WhatsAppSetting).filter_by(tenant_id=g.parlour_id).first()
    meta_app_id = current_app.config.get("META_APP_ID") or os.getenv("META_APP_ID", "")
    config_id = current_app.config.get("META_CONFIG_ID") or os.getenv("META_CONFIG_ID", "")
    graph_version = current_app.config.get("META_GRAPH_API_VERSION") or os.getenv("META_GRAPH_API_VERSION", "v21.0")
    redirect_uri = current_app.config.get("META_REDIRECT_URI") or os.getenv("META_REDIRECT_URI", "")

    if not setting:
        return success_response({
            "status": "DISCONNECTED",
            "business_name": "",
            "phone_number": "",
            "meta_phone_number_id": "",
            "meta_waba_id": "",
            "connected_at": None,
            "last_synced_at": None,
            "meta_app_id": meta_app_id,
            "meta_config_id": config_id,
            "meta_graph_api_version": graph_version,
            "meta_redirect_uri": redirect_uri
        })

    res_dict = setting.to_dict()
    res_dict["meta_app_id"] = meta_app_id
    res_dict["meta_config_id"] = config_id
    res_dict["meta_graph_api_version"] = graph_version
    res_dict["meta_redirect_uri"] = redirect_uri
    return success_response(res_dict)


@whatsapp_bp.route("/whatsapp/oauth/connect", methods=["POST"])
@require_role(["ParlourAdmin"])
def connect_meta_oauth():
    """Exchanges Meta OAuth Embedded Signup code, auto-discovers WABA and Phone IDs, and saves tenant credentials."""
    data = request.get_json() or {}
    code = data.get("code") or data.get("auth_code")

    if not code:
        return error_response("OAUTH_ERROR", "Meta OAuth authorization code is required.", 400)

    try:
        # 1. Exchange OAuth code for Access Token
        token_data = WhatsAppService.exchange_oauth_code_for_token(code)
        access_token = token_data.get("access_token")

        # 2. Auto-fetch WABA ID, Phone Number ID, Display Phone, Business Name
        meta_info = WhatsAppService.fetch_waba_and_phone_details(access_token)

        # 3. Save or Update WhatsAppSetting for current tenant
        setting = get_tenant_query(WhatsAppSetting).filter_by(tenant_id=g.parlour_id).first()
        if not setting:
            setting = WhatsAppSetting(tenant_id=g.parlour_id)
            db.session.add(setting)

        setting.meta_waba_id = meta_info.get("waba_id")
        setting.meta_phone_number_id = meta_info.get("phone_number_id")
        setting.access_token = access_token
        setting.phone_number = meta_info.get("phone_number")
        setting.business_name = meta_info.get("business_name")
        setting.status = "CONNECTED"
        setting.connected_at = datetime.now(timezone.utc)
        setting.last_synced_at = datetime.now(timezone.utc)

        # Log OAuth Connection Event
        log_entry = WhatsAppLog(
            tenant_id=g.parlour_id,
            event_type="OAUTH_CONNECT",
            payload_json=f"Connected WhatsApp WABA '{setting.meta_waba_id}' Phone '{setting.phone_number}'"
        )
        db.session.add(log_entry)
        db.session.commit()

        return success_response({
            "message": "WhatsApp Business Account connected successfully via Meta OAuth!",
            "settings": setting.to_dict()
        })
    except ValueError as ve:
        return error_response("OAUTH_ERROR", str(ve), 400)
    except Exception as e:
        logger.error(f"Meta OAuth connection error: {str(e)}")
        return error_response("SERVER_ERROR", f"Failed to connect Meta WhatsApp account: {str(e)}", 500)


@whatsapp_bp.route("/whatsapp/disconnect", methods=["POST"])
@require_role(["ParlourAdmin"])
def disconnect_whatsapp():
    """Disconnects Meta WhatsApp account for current tenant."""
    setting = get_tenant_query(WhatsAppSetting).filter_by(tenant_id=g.parlour_id).first()
    if setting:
        setting.status = "DISCONNECTED"
        setting.encrypted_access_token = ""
        setting.meta_phone_number_id = ""
        setting.meta_waba_id = ""

        log_entry = WhatsAppLog(
            tenant_id=g.parlour_id,
            event_type="OAUTH_DISCONNECT",
            payload_json="Disconnected WhatsApp Account"
        )
        db.session.add(log_entry)
        db.session.commit()

    return success_response({"message": "WhatsApp Business Account disconnected successfully."})


@whatsapp_bp.route("/whatsapp/webhook", methods=["GET", "POST"])
def whatsapp_webhook():
    """Public Webhook endpoint for Meta Cloud API status receipts."""
    if request.method == "GET":
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")

        if mode == "subscribe" and challenge:
            return challenge, 200
        return "Webhook Verification Endpoint", 200

    # POST Webhook status updates from Meta
    payload = request.get_json() or {}
    logger.info(f"Received Meta Webhook Payload: {payload}")
    return jsonify({"status": "received"}), 200
