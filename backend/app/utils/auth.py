from functools import wraps
from flask import g
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from app.utils.responses import error_response

def get_tenant_query(model):
    """
    Returns a query object for the model filtered automatically by the current request's tenant_id.
    """
    if not hasattr(g, "parlour_id"):
        raise RuntimeError("Attempted to run tenant query outside a tenant-authenticated context.")
    return model.query.filter_by(tenant_id=g.parlour_id, is_deleted=False) if hasattr(model, "is_deleted") else model.query.filter_by(tenant_id=g.parlour_id)

def get_tenant_query_with_deleted(model):
    """
    Returns a query object for the model filtered automatically by the current request's tenant_id, including soft deleted records.
    """
    if not hasattr(g, "parlour_id"):
        raise RuntimeError("Attempted to run tenant query outside a tenant-authenticated context.")
    return model.query.filter_by(tenant_id=g.parlour_id)

def require_role(roles):
    """
    Decorator to enforce role permissions and bind tenant context to flask.g.
    Accepts a single role string or a list of role strings.
    """
    if isinstance(roles, str):
        roles = [roles]

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            claims = get_jwt()
            
            user_id = int(identity) if identity else None
            parlour_id = claims.get("parlour_id")
            role = claims.get("role")

            # Check if role matches
            if role not in roles:
                return error_response(
                    error_code="FORBIDDEN_ACCESS",
                    message="You do not have permission to perform this action.",
                    status_code=403
                )

            # Enforce that ParlourAdmin must have a parlour_id
            if "ParlourAdmin" in roles and role == "ParlourAdmin" and not parlour_id:
                return error_response(
                    error_code="TENANT_CONTEXT_MISSING",
                    message="Tenant context is missing from authorization payload.",
                    status_code=403
                )

            # Bind contexts to thread-local g
            g.user_id = user_id
            g.parlour_id = parlour_id
            g.role = role

            return fn(*args, **kwargs)
        return wrapper
    return decorator
