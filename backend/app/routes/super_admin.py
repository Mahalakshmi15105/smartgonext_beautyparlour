from flask import Blueprint, request, g
from app.database import db
from app.models.global_models import Tenant, SubscriptionPlan
from app.models.user import User, TenantSetting
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.billing import Invoice
from app.models.audit import AuditLog
from app.utils.responses import success_response, error_response
from app.utils.auth import require_role
from app.utils.query import paginate_query
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)
super_admin_bp = Blueprint("super_admin", __name__)

@super_admin_bp.route("/super-admin/dashboard", methods=["GET"])
@require_role(["SuperAdmin"])
def get_super_admin_dashboard():
    now = datetime.now(timezone.utc)
    
    # 1. Tenant Metrics
    total_tenants = Tenant.query.count()
    active_tenants = Tenant.query.filter_by(status="active").count()
    suspended_tenants = Tenant.query.filter_by(status="suspended").count()
    
    # Expired subscriptions
    expired_subs = Tenant.query.filter(
        Tenant.subscription_expires_at < now,
        Tenant.status == "active"
    ).count()

    # 2. MRR & ARR Calculations
    # Calculate MRR by summing subscription plan prices for active tenants
    active_tenant_plans = db.session.query(SubscriptionPlan.price).join(
        Tenant, Tenant.subscription_plan_id == SubscriptionPlan.id
    ).filter(Tenant.status == "active").all()

    mrr = sum([Decimal(str(r.price or 0.0)) for r in active_tenant_plans])
    arr = mrr * Decimal("12.00")

    # 3. Platform-Wide Aggregates
    total_customers = Customer.query.count()
    total_employees = Employee.query.count()
    total_invoices = Invoice.query.count()

    # 4. Recent Tenants
    recent_tenants_query = Tenant.query.order_by(Tenant.created_at.desc()).limit(5).all()
    recent_tenants = [
        {
            "id": t.id,
            "name": t.name,
            "status": t.status,
            "plan_name": t.subscription_plan.name if t.subscription_plan else "Standard",
            "created_at": t.created_at.isoformat()
        } for t in recent_tenants_query
    ]

    return success_response({
        "metrics": {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "suspended_tenants": suspended_tenants,
            "expired_subscriptions": expired_subs,
            "mrr": float(mrr),
            "arr": float(arr),
            "total_customers": total_customers,
            "total_employees": total_employees,
            "total_invoices": total_invoices
        },
        "recent_tenants": recent_tenants
    })


@super_admin_bp.route("/super-admin/tenants", methods=["GET"])
@require_role(["SuperAdmin"])
def get_tenants():
    q = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    limit = request.args.get("limit", 20)
    cursor = request.args.get("cursor")

    query = Tenant.query

    if q:
        query = query.filter(Tenant.name.ilike(f"%{q}%"))

    if status:
        query = query.filter(Tenant.status == status)

    tenants, next_cursor = paginate_query(
        query=query,
        model=Tenant,
        limit_val=limit,
        cursor=cursor,
        sort_field="id",
        sort_desc=True
    )

    items = []
    for t in tenants:
        # Find admin user for tenant
        admin_user = User.query.filter_by(tenant_id=t.id, role="ParlourAdmin").first()
        items.append({
            "id": t.id,
            "name": t.name,
            "status": t.status,
            "admin_email": admin_user.email if admin_user else "N/A",
            "plan_name": t.subscription_plan.name if t.subscription_plan else "N/A",
            "subscription_expires_at": t.subscription_expires_at.isoformat() if t.subscription_expires_at else None,
            "created_at": t.created_at.isoformat()
        })

    return success_response({
        "items": items,
        "next_cursor": next_cursor
    })


@super_admin_bp.route("/super-admin/tenants", methods=["POST"])
@require_role(["SuperAdmin"])
def create_tenant():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    admin_email = data.get("admin_email", "").strip()
    admin_password = data.get("admin_password", "").strip()
    plan_id = data.get("plan_id")

    if not name or not admin_email or not admin_password or not plan_id:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="Parlour Name, Admin Email, Admin Password, and Plan ID are required.",
            status_code=400
        )

    # Check duplicate email
    if User.query.filter_by(email=admin_email).first():
        return error_response(
            error_code="DUPLICATE_RECORD",
            message=f"User with email '{admin_email}' already exists.",
            status_code=400
        )

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return error_response(
            error_code="PLAN_NOT_FOUND",
            message="Selected subscription plan does not exist.",
            status_code=400
        )

    try:
        # 1. Create Tenant
        expiry_date = datetime.now(timezone.utc) + timedelta(days=plan.duration_days)
        tenant = Tenant(
            name=name,
            status="active",
            subscription_plan_id=plan.id,
            subscription_expires_at=expiry_date
        )
        db.session.add(tenant)
        db.session.flush()

        # 2. Create Tenant Admin User
        user = User(
            tenant_id=tenant.id,
            email=admin_email,
            role="ParlourAdmin",
            status="active"
        )
        user.set_password(admin_password)
        db.session.add(user)

        # 3. Initialize Tenant Settings
        setting = TenantSetting(
            tenant_id=tenant.id,
            tax_name="GST",
            tax_rate=18.00,
            currency="INR",
            currency_symbol="₹"
        )
        db.session.add(setting)

        # Log action
        log = AuditLog(
            tenant_id=tenant.id,
            user_id=g.user_id,
            action="TENANT_PROVISIONED",
            resource_name="Tenant",
            resource_id=tenant.id,
            details=f"Provisioned Beauty Parlour: '{name}' with Admin: '{admin_email}'"
        )
        db.session.add(log)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to provision tenant: {str(e)}")
        return error_response(
            error_code="TRANSACTION_FAILED",
            message="Failed to provision new tenant.",
            status_code=500
        )

    return success_response({"tenant_id": tenant.id, "name": tenant.name}, 201)


@super_admin_bp.route("/super-admin/tenants/<int:tenant_id>", methods=["PUT"])
@require_role(["SuperAdmin"])
def update_tenant(tenant_id):
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return error_response(
            error_code="TENANT_NOT_FOUND",
            message="Tenant not found.",
            status_code=404
        )

    data = request.get_json() or {}
    status = data.get("status")
    plan_id = data.get("plan_id")

    try:
        if status in ["active", "suspended", "closed"]:
            tenant.status = status

        if plan_id:
            plan = SubscriptionPlan.query.get(plan_id)
            if plan:
                tenant.subscription_plan_id = plan.id
                tenant.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=plan.duration_days)

        log = AuditLog(
            tenant_id=tenant.id,
            user_id=g.user_id,
            action="TENANT_UPDATED",
            resource_name="Tenant",
            resource_id=tenant.id,
            details=f"Updated Tenant ID {tenant.id} Status: {tenant.status}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update tenant: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to update tenant.",
            status_code=500
        )

    return success_response({"message": "Tenant updated successfully."})


@super_admin_bp.route("/super-admin/subscription-plans", methods=["GET"])
@require_role(["SuperAdmin"])
def get_subscription_plans():
    plans = SubscriptionPlan.query.all()
    data = [
        {
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "duration_days": p.duration_days,
            "max_employees": p.max_employees,
            "max_services": p.max_services,
            "max_customers": p.max_customers
        } for p in plans
    ]
    return success_response(data)


@super_admin_bp.route("/super-admin/system-health", methods=["GET"])
@require_role(["SuperAdmin"])
def get_system_health():
    # Test DB Connection
    db_healthy = True
    try:
        db.session.execute(db.select(1))
    except Exception:
        db_healthy = False

    return success_response({
        "status": "healthy" if db_healthy else "unhealthy",
        "database_status": "connected" if db_healthy else "disconnected",
        "api_gateway": "operational",
        "active_tenant_sessions": Tenant.query.filter_by(status="active").count(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@super_admin_bp.route("/super-admin/audit-logs", methods=["GET"])
@require_role(["SuperAdmin"])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()
    data = [
        {
            "id": l.id,
            "action": l.action,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat()
        } for l in logs
    ]
    return success_response(data)
