from flask import Blueprint, request, g
from app.database import db
from app.models.catalog import Product
from app.utils.responses import success_response, error_response
from app.utils.auth import require_role, get_tenant_query
from app.utils.query import paginate_query
import logging

logger = logging.getLogger(__name__)
products_bp = Blueprint("products", __name__)

@products_bp.route("/products", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_products():
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    status = request.args.get("status", "").strip()
    limit = request.args.get("limit", 20)
    cursor = request.args.get("cursor")
    sort = request.args.get("sort", "name")

    query = get_tenant_query(Product)

    if q:
        query = query.filter(
            (Product.name.ilike(f"%{q}%")) |
            (Product.sku.ilike(f"%{q}%")) |
            (Product.barcode.ilike(f"%{q}%"))
        )

    if category:
        query = query.filter(Product.category == category)

    if status:
        query = query.filter(Product.status == status)

    sort_field = "id"
    sort_desc = False
    if sort.startswith("-"):
        sort_field = sort[1:]
        sort_desc = True
    else:
        sort_field = sort

    products, next_cursor = paginate_query(
        query=query,
        model=Product,
        limit_val=limit,
        cursor=cursor,
        sort_field=sort_field,
        sort_desc=sort_desc
    )

    data = [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "sku": p.sku,
            "barcode": p.barcode,
            "cost_price": float(p.cost_price),
            "selling_price": float(p.selling_price),
            "stock_quantity": p.stock_quantity,
            "low_stock_threshold": p.low_stock_threshold,
            "status": p.status,
            "created_at": p.created_at.isoformat()
        } for p in products
    ]

    return success_response({
        "items": data,
        "next_cursor": next_cursor
    })


@products_bp.route("/products/<int:product_id>", methods=["GET"])
@require_role(["ParlourAdmin"])
def get_product(product_id):
    product = get_tenant_query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response(
            error_code="PRODUCT_NOT_FOUND",
            message="Product not found or access denied.",
            status_code=404
        )
    return success_response({
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "sku": product.sku,
        "barcode": product.barcode,
        "cost_price": float(product.cost_price),
        "selling_price": float(product.selling_price),
        "stock_quantity": product.stock_quantity,
        "low_stock_threshold": product.low_stock_threshold,
        "status": product.status,
        "created_at": product.created_at.isoformat()
    })


@products_bp.route("/products", methods=["POST"])
@require_role(["ParlourAdmin"])
def create_product():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    sku = data.get("sku", "").strip() or None
    barcode = data.get("barcode", "").strip() or None
    cost_price = data.get("cost_price", 0.00)
    selling_price = data.get("selling_price", 0.00)
    stock = data.get("stock_quantity", 0)
    threshold = data.get("low_stock_threshold", 5)

    if not name:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="Product name is required.",
            status_code=400
        )

    # Validate numbers
    try:
        cp_val = float(cost_price)
        sp_val = float(selling_price)
        stock_val = int(stock)
        thresh_val = int(threshold)
        if cp_val < 0 or sp_val < 0 or stock_val < 0 or thresh_val < 0:
            raise ValueError()
    except ValueError:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="Prices, stock levels, and stock thresholds must be positive values.",
            status_code=400
        )

    # Check unique constraints (SKU and Barcode) in tenant context
    if sku:
        dup_sku = get_tenant_query(Product).filter_by(sku=sku).first()
        if dup_sku:
            return error_response(
                error_code="DUPLICATE_RECORD",
                message=f"A product with SKU '{sku}' already exists.",
                status_code=400
            )

    if barcode:
        dup_bar = get_tenant_query(Product).filter_by(barcode=barcode).first()
        if dup_bar:
            return error_response(
                error_code="DUPLICATE_RECORD",
                message=f"A product with Barcode '{barcode}' already exists.",
                status_code=400
            )

    try:
        product = Product(
            tenant_id=g.parlour_id,
            name=name,
            category=data.get("category"),
            sku=sku,
            barcode=barcode,
            cost_price=cp_val,
            selling_price=sp_val,
            stock_quantity=stock_val,
            low_stock_threshold=thresh_val,
            status=data.get("status", "active")
        )
        db.session.add(product)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating product: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to create product record.",
            status_code=500
        )

    return success_response({
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "selling_price": float(product.selling_price)
    }, 201)


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@require_role(["ParlourAdmin"])
def update_product(product_id):
    product = get_tenant_query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response(
            error_code="PRODUCT_NOT_FOUND",
            message="Product not found or access denied.",
            status_code=404
        )

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    sku = data.get("sku", "").strip() or None
    barcode = data.get("barcode", "").strip() or None
    cost_price = data.get("cost_price", 0.00)
    selling_price = data.get("selling_price", 0.00)
    stock = data.get("stock_quantity", 0)
    threshold = data.get("low_stock_threshold", 5)

    if not name:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="Product name is required.",
            status_code=400
        )

    try:
        cp_val = float(cost_price)
        sp_val = float(selling_price)
        stock_val = int(stock)
        thresh_val = int(threshold)
        if cp_val < 0 or sp_val < 0 or stock_val < 0 or thresh_val < 0:
            raise ValueError()
    except ValueError:
        return error_response(
            error_code="VALIDATION_FAILED",
            message="Prices, stock levels, and stock thresholds must be positive values.",
            status_code=400
        )

    # Check unique constraints
    if sku:
        dup_sku = get_tenant_query(Product).filter(Product.sku == sku, Product.id != product_id).first()
        if dup_sku:
            return error_response(
                error_code="DUPLICATE_RECORD",
                message=f"Another product with SKU '{sku}' already exists.",
                status_code=400
            )

    if barcode:
        dup_bar = get_tenant_query(Product).filter(Product.barcode == barcode, Product.id != product_id).first()
        if dup_bar:
            return error_response(
                error_code="DUPLICATE_RECORD",
                message=f"Another product with Barcode '{barcode}' already exists.",
                status_code=400
            )

    try:
        product.name = name
        product.category = data.get("category")
        product.sku = sku
        product.barcode = barcode
        product.cost_price = cp_val
        product.selling_price = sp_val
        product.stock_quantity = stock_val
        product.low_stock_threshold = thresh_val
        product.status = data.get("status", "active")
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating product: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to update product record.",
            status_code=500
        )

    return success_response({"message": "Product updated successfully."})


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
@require_role(["ParlourAdmin"])
def delete_product(product_id):
    product = get_tenant_query(Product).filter_by(id=product_id).first()
    if not product:
        return error_response(
            error_code="PRODUCT_NOT_FOUND",
            message="Product not found or access denied.",
            status_code=404
        )

    try:
        product.soft_delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting product: {str(e)}")
        return error_response(
            error_code="DATABASE_ERROR",
            message="Failed to delete product record.",
            status_code=500
        )

    return success_response({"message": "Product soft-deleted successfully."})
