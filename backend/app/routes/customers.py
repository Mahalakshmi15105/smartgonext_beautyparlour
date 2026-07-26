from flask import Blueprint, request, g
from app.database import db
from app.models.customer import Customer
from app.utils.responses import success_response, error_response
from app.utils.auth import require_role, get_tenant_query
from app.utils.query import paginate_query
import logging

logger = logging.getLogger(__name__)
customers_bp = Blueprint("customers", __name__)

@customers_bp.route("/customers", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_customers():
    # Parse query parameters
    q = request.args.get("q", "").strip()
    gender = request.args.get("gender", "").strip()
    limit = request.args.get("limit", 20)
    cursor = request.args.get("cursor")
    sort = request.args.get("sort", "-created_at")

    # Start tenant query
    query = get_tenant_query(Customer)

    # Search filter
    if q:
        query = query.filter(
            (Customer.first_name.ilike(f"%{q}%")) |
            (Customer.last_name.ilike(f"%{q}%")) |
            (Customer.phone.ilike(f"%{q}%")) |
            (Customer.email.ilike(f"%{q}%"))
        )

    # Gender filter
    if gender:
        query = query.filter(Customer.gender == gender)

    # Sorting options
    sort_field = "id"
    sort_desc = False
    if sort.startswith("-"):
        sort_field = sort[1:]
        sort_desc = True
    else:
        sort_field = sort

    customers, next_cursor = paginate_query(
        query=query,
        model=Customer,
        limit_val=limit,
        cursor=cursor,
        sort_field=sort_field,
        sort_desc=sort_desc
    )

    data = [
        {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "phone": c.phone,
            "email": c.email,
            "gender": c.gender,
            "date_of_birth": c.date_of_birth.isoformat() if c.date_of_birth else None,
            "address": c.address,
            "notes": c.notes,
            "created_at": c.created_at.isoformat()
        } for c in customers
    ]

    return success_response({
        "items": data,
        "next_cursor": next_cursor
    })


@customers_bp.route("/customers/<int:customer_id>", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_customer(customer_id):
    customer = get_tenant_query(Customer).filter_by(id=customer_id).first()
    if not customer:
        return error_response(
            error_code="CUSTOMER_NOT_FOUND",
            message="Customer not found or access denied.",
            status_code=404
        )
    return success_response({
        "id": customer.id,
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "phone": customer.phone,
        "email": customer.email,
        "gender": customer.gender,
        "date_of_birth": customer.date_of_birth.isoformat() if customer.date_of_birth else None,
        "address": customer.address,
        "notes": customer.notes,
        "created_at": customer.created_at.isoformat()
    })


@customers_bp.route("/customers", methods=["POST"])
@require_role(["ParlourAdmin"])
def create_customer():
    data = request.get_json() or {}
    first_name = data.get("first_name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower() if data.get("email") else None
    
    # Validation
    if not first_name or not phone:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="First name and phone number are required.",
            status_code=400
        )

    # Check duplicates in tenant context
    dup = get_tenant_query(Customer).filter_by(phone=phone).first()
    if dup:
        return error_response(
            error_code="DUPLICATE_RECORD",
            message=f"A customer with phone number {phone} already exists.",
            status_code=400
        )

    dob = None
    if data.get("date_of_birth"):
        from datetime import datetime
        try:
            dob = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                error_code="VALIDATION_FAILED",
                message="Date of birth must be in YYYY-MM-DD format.",
                status_code=400
            )

    try:
        customer = Customer(
            tenant_id=g.parlour_id,
            first_name=first_name,
            last_name=data.get("last_name"),
            phone=phone,
            email=email,
            gender=data.get("gender"),
            date_of_birth=dob,
            address=data.get("address"),
            notes=data.get("notes")
        )
        db.session.add(customer)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating customer: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to create customer record.",
            status_code=500
        )

    return success_response({
        "id": customer.id,
        "first_name": customer.first_name,
        "phone": customer.phone
    }, 201)


@customers_bp.route("/customers/<int:customer_id>", methods=["PUT"])
@require_role(["ParlourAdmin"])
def update_customer(customer_id):
    customer = get_tenant_query(Customer).filter_by(id=customer_id).first()
    if not customer:
        return error_response(
            error_code="CUSTOMER_NOT_FOUND",
            message="Customer not found or access denied.",
            status_code=404
        )

    data = request.get_json() or {}
    first_name = data.get("first_name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower() if data.get("email") else None

    if not first_name or not phone:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="First name and phone number are required.",
            status_code=400
        )

    # Check duplicate phone for other records
    dup = get_tenant_query(Customer).filter(Customer.phone == phone, Customer.id != customer_id).first()
    if dup:
        return error_response(
            error_code="DUPLICATE_RECORD",
            message=f"Another customer with phone number {phone} already exists.",
            status_code=400
        )

    dob = None
    if data.get("date_of_birth"):
        from datetime import datetime
        try:
            dob = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                error_code="VALIDATION_FAILED",
                message="Date of birth must be in YYYY-MM-DD format.",
                status_code=400
            )

    try:
        customer.first_name = first_name
        customer.last_name = data.get("last_name")
        customer.phone = phone
        customer.email = email
        customer.gender = data.get("gender")
        customer.date_of_birth = dob
        customer.address = data.get("address")
        customer.notes = data.get("notes")
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating customer: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to update customer record.",
            status_code=500
        )

    return success_response({"message": "Customer updated successfully."})


@customers_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
@require_role(["ParlourAdmin"])
def delete_customer(customer_id):
    customer = get_tenant_query(Customer).filter_by(id=customer_id).first()
    if not customer:
        return error_response(
            error_code="CUSTOMER_NOT_FOUND",
            message="Customer not found or access denied.",
            status_code=404
        )

    try:
        customer.soft_delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting customer: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to delete customer record.",
            status_code=500
        )

    return success_response({"message": "Customer soft-deleted successfully."})


@customers_bp.route("/customers/<int:customer_id>/memberships", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_customer_memberships(customer_id):
    from app.models.membership import CustomerMembership, MembershipBenefit
    
    # Verify customer exists in tenant context
    customer = get_tenant_query(Customer).filter_by(id=customer_id).first()
    if not customer:
        return error_response(
            error_code="CUSTOMER_NOT_FOUND",
            message="Customer not found.",
            status_code=404
        )

    # Fetch active memberships
    memberships = CustomerMembership.query.filter_by(
        customer_id=customer_id,
        tenant_id=g.parlour_id,
        status="active"
    ).all()

    data = []
    for m in memberships:
        benefits = []
        for b in m.benefits:
            benefits.append({
                "id": b.id,
                "service_id": b.service_id,
                "service_name": b.service.name if b.service else None,
                "total_quantity": b.total_quantity,
                "remaining_quantity": b.remaining_quantity
            })
        
        data.append({
            "id": m.id,
            "plan_name": m.plan.name if m.plan else "Default Membership",
            "expires_at": m.expires_at.isoformat(),
            "status": m.status,
            "benefits": benefits
        })

    return success_response(data)
