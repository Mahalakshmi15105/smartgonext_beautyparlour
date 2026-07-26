from flask import Blueprint, request, g
from app.database import db
from app.models.user import TenantSetting
from app.models.global_models import Tenant
from app.utils.responses import success_response, error_response
from app.utils.auth import require_role
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)
settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/settings", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_settings():
    setting = TenantSetting.query.filter_by(tenant_id=g.parlour_id).first()
    if not setting:
        # Create default tenant settings if missing
        setting = TenantSetting(tenant_id=g.parlour_id)
        db.session.add(setting)
        db.session.commit()

    tenant = Tenant.query.get(g.parlour_id)

    return success_response({
        "business_profile": {
            "name": tenant.name if tenant else "Beauty Parlour",
            "owner_name": setting.owner_name or "",
            "phone": setting.alternate_phone or "",
            "alternate_phone": setting.alternate_phone or "",
            "email": setting.website or "",
            "gst_number": setting.gst_number or "",
            "address": setting.address or "",
            "city": setting.city or "",
            "state": setting.state or "",
            "country": setting.country or "",
            "postal_code": setting.postal_code or "",
            "website": setting.website or "",
            "description": setting.description or ""
        },
        "invoice_settings": {
            "invoice_prefix": setting.invoice_prefix or "INV",
            "tax_name": setting.tax_name or "GST",
            "tax_rate": float(setting.tax_rate or 18.00),
            "receipt_header": setting.receipt_header or "",
            "receipt_footer": setting.receipt_footer or "",
            "terms_and_conditions": setting.terms_and_conditions or "",
            "show_logo": setting.show_logo if setting.show_logo is not None else True
        },
        "regional_settings": {
            "currency": setting.currency or "INR",
            "currency_symbol": setting.currency_symbol or "₹",
            "date_format": setting.date_format or "YYYY-MM-DD",
            "timezone": setting.timezone or "UTC"
        }
    })


@settings_bp.route("/settings", methods=["PUT"])
@require_role(["ParlourAdmin"])
def update_settings():
    data = request.get_json() or {}
    setting = TenantSetting.query.filter_by(tenant_id=g.parlour_id).first()
    if not setting:
        setting = TenantSetting(tenant_id=g.parlour_id)
        db.session.add(setting)

    tenant = Tenant.query.get(g.parlour_id)

    biz = data.get("business_profile", {})
    inv = data.get("invoice_settings", {})
    reg = data.get("regional_settings", {})

    try:
        # Update Business Profile
        if tenant and biz.get("name"):
            tenant.name = biz["name"].strip()

        setting.owner_name = biz.get("owner_name")
        setting.alternate_phone = biz.get("phone") or biz.get("alternate_phone")
        setting.gst_number = biz.get("gst_number")
        setting.address = biz.get("address")
        setting.city = biz.get("city")
        setting.state = biz.get("state")
        setting.country = biz.get("country")
        setting.postal_code = biz.get("postal_code")
        setting.website = biz.get("website")
        setting.description = biz.get("description")

        # Update Invoice Settings
        if inv.get("invoice_prefix"):
            setting.invoice_prefix = inv["invoice_prefix"].strip()
        if inv.get("tax_name"):
            setting.tax_name = inv["tax_name"].strip()
        if inv.get("tax_rate") is not None:
            setting.tax_rate = Decimal(str(inv["tax_rate"]))
        setting.receipt_header = inv.get("receipt_header")
        setting.receipt_footer = inv.get("receipt_footer")
        setting.terms_and_conditions = inv.get("terms_and_conditions")
        if inv.get("show_logo") is not None:
            setting.show_logo = bool(inv["show_logo"])

        # Update Regional Settings
        if reg.get("currency"):
            setting.currency = reg["currency"].strip()
        if reg.get("currency_symbol"):
            setting.currency_symbol = reg["currency_symbol"].strip()
        if reg.get("date_format"):
            setting.date_format = reg["date_format"].strip()
        if reg.get("timezone"):
            setting.timezone = reg["timezone"].strip()

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update tenant settings: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to update settings.",
            status_code=500
        )

    return success_response({"message": "Settings updated successfully."})
