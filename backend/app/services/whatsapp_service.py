import json
import logging
import requests
from datetime import datetime, timezone
from flask import current_app
from app.database import db
from app.models.whatsapp import WhatsAppSetting, WhatsAppLog

logger = logging.getLogger(__name__)


def get_meta_graph_base() -> str:
    version = current_app.config.get("META_GRAPH_API_VERSION") or os.getenv("META_GRAPH_API_VERSION", "v21.0")
    return f"https://graph.facebook.com/{version.lstrip('/')}"


class WhatsAppService:

    @staticmethod
    def exchange_oauth_code_for_token(code: str, redirect_uri: str = None) -> dict:
        """Exchanges Meta OAuth Embedded Signup authorization code for a long-lived Access Token."""
        app_id = current_app.config.get("META_APP_ID") or os.getenv("META_APP_ID", "")
        app_secret = current_app.config.get("META_APP_SECRET") or os.getenv("META_APP_SECRET", "")
        configured_redirect = current_app.config.get("META_REDIRECT_URI") or os.getenv("META_REDIRECT_URI", "")
        
        if not app_id or not app_secret:
            raise ValueError("META_APP_ID or META_APP_SECRET environment variables are missing.")

        target_redirect = redirect_uri or configured_redirect

        url = f"{get_meta_graph_base()}/oauth/access_token"
        params = {
            "client_id": app_id,
            "client_secret": app_secret,
            "code": code,
        }
        if target_redirect:
            params["redirect_uri"] = target_redirect

        try:
            res = requests.get(url, params=params, timeout=15)
            data = res.json()
            if res.status_code != 200:
                logger.error(f"Meta OAuth exchange failed: {data}")
                raise ValueError(data.get("error", {}).get("message", "Meta OAuth exchange failed."))
            return data
        except requests.RequestException as e:
            logger.error(f"Meta OAuth request error: {str(e)}")
            raise ValueError(f"Failed to connect with Meta OAuth server: {str(e)}")

    @staticmethod
    def fetch_waba_and_phone_details(access_token: str) -> dict:
        """Discovers WhatsApp Business Account ID, Phone Number ID, Display Phone Number, and Business Name for given access token."""
        headers = {"Authorization": f"Bearer {access_token}"}
        graph_base = get_meta_graph_base()
        
        # 1. Fetch WABAs owned/managed by the token identity
        waba_url = f"{graph_base}/me/whatsapp_business_accounts"
        try:
            res = requests.get(waba_url, headers=headers, timeout=15)
            data = res.json()
            wabas = data.get("data", [])
            
            waba_id = None
            waba_name = None
            if wabas:
                waba_id = wabas[0].get("id")
                waba_name = wabas[0].get("name")
            
            # Fallback check on /me or environment defaults if WABA list is not directly exposed
            if not waba_id:
                waba_id = current_app.config.get("WHATSAPP_BUSINESS_ACCOUNT_ID") or os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
            
            if not waba_name:
                me_url = f"{graph_base}/me?fields=id,name"
                me_res = requests.get(me_url, headers=headers, timeout=15).json()
                waba_name = me_res.get("name", "WhatsApp Business Account")

            # 2. Fetch Phone Numbers under this WABA
            phone_number_id = current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
            display_phone = ""

            if waba_id:
                phone_url = f"{graph_base}/{waba_id}/phone_numbers"
                phone_res = requests.get(phone_url, headers=headers, timeout=15).json()
                phones = phone_res.get("data", [])
                if phones:
                    phone_number_id = phones[0].get("id", phone_number_id)
                    display_phone = phones[0].get("display_phone_number", "")

            return {
                "waba_id": waba_id or "",
                "phone_number_id": phone_number_id or "",
                "phone_number": display_phone,
                "business_name": waba_name or "Salon Business"
            }
        except Exception as e:
            logger.error(f"Error fetching WABA details: {str(e)}")
            raise ValueError(f"Failed to fetch Meta WABA account details: {str(e)}")

    @staticmethod
    def send_text_message(tenant_setting: WhatsAppSetting, recipient_phone: str, message_body: str) -> dict:
        """Sends a plain text WhatsApp message via Meta Cloud API using tenant's credentials."""
        token = tenant_setting.access_token or current_app.config.get("WHATSAPP_PERMANENT_ACCESS_TOKEN") or os.getenv("WHATSAPP_PERMANENT_ACCESS_TOKEN", "")
        phone_number_id = tenant_setting.meta_phone_number_id or current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

        if not token or not phone_number_id:
            return {
                "success": False,
                "meta_message_id": None,
                "status": "FAILED",
                "error": "WhatsApp access token or Phone Number ID is missing for this tenant."
            }

        # Clean phone number (digits only with country code)
        clean_phone = "".join(filter(str.isdigit, recipient_phone))
        if not clean_phone.startswith("91") and len(clean_phone) == 10:
            clean_phone = f"91{clean_phone}"

        url = f"{get_meta_graph_base()}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {"preview_url": False, "body": message_body}
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            data = res.json()
            if res.status_code in [200, 201] and "messages" in data:
                meta_id = data["messages"][0]["id"]
                return {
                    "success": True,
                    "meta_message_id": meta_id,
                    "status": "SENT",
                    "response": data
                }
            else:
                err_msg = data.get("error", {}).get("message", f"HTTP {res.status_code} error from Meta API.")
                return {
                    "success": False,
                    "meta_message_id": None,
                    "status": "FAILED",
                    "error": err_msg,
                    "response": data
                }
        except Exception as e:
            return {
                "success": False,
                "meta_message_id": None,
                "status": "FAILED",
                "error": f"Network request failure: {str(e)}"
            }

    @staticmethod
    def send_image_message(tenant_setting: WhatsAppSetting, recipient_phone: str, image_url: str, caption_body: str) -> dict:
        """Sends an image + caption WhatsApp message via Meta Cloud API using tenant's credentials."""
        token = tenant_setting.access_token or current_app.config.get("WHATSAPP_PERMANENT_ACCESS_TOKEN") or os.getenv("WHATSAPP_PERMANENT_ACCESS_TOKEN", "")
        phone_number_id = tenant_setting.meta_phone_number_id or current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

        if not token or not phone_number_id:
            return {
                "success": False,
                "meta_message_id": None,
                "status": "FAILED",
                "error": "WhatsApp access token or Phone Number ID is missing for this tenant."
            }

        clean_phone = "".join(filter(str.isdigit, recipient_phone))
        if not clean_phone.startswith("91") and len(clean_phone) == 10:
            clean_phone = f"91{clean_phone}"

        # Build full URL if relative
        full_img_url = image_url
        if image_url and not (image_url.startswith("http://") or image_url.startswith("https://")):
            full_img_url = f"http://localhost:5000{image_url if image_url.startswith('/') else '/' + image_url}"

        url = f"{get_meta_graph_base()}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "image",
            "image": {
                "link": full_img_url,
                "caption": caption_body or ""
            }
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            data = res.json()
            if res.status_code in [200, 201] and "messages" in data:
                meta_id = data["messages"][0]["id"]
                return {
                    "success": True,
                    "meta_message_id": meta_id,
                    "status": "SENT",
                    "response": data
                }
            else:
                err_msg = data.get("error", {}).get("message", f"HTTP {res.status_code} error from Meta API.")
                return {
                    "success": False,
                    "meta_message_id": None,
                    "status": "FAILED",
                    "error": err_msg,
                    "response": data
                }
        except Exception as e:
            return {
                "success": False,
                "meta_message_id": None,
                "status": "FAILED",
                "error": f"Network request failure: {str(e)}"
            }
