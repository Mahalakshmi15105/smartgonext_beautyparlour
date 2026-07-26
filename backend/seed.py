from app import create_app
from app.database import db
from app.models.global_models import SubscriptionPlan, Tenant
from app.models.user import User, TenantSetting

app = create_app()

def seed_database():
    with app.app_context():
        # 1. Create Default Subscription Plan
        plan = SubscriptionPlan.query.filter_by(name="Standard Business Plan").first()
        if not plan:
            plan = SubscriptionPlan(
                name="Standard Business Plan",
                price=2999.00,
                duration_days=365,
                max_employees=15,
                max_services=100,
                max_customers=1000
            )
            db.session.add(plan)
            db.session.commit()
            print("Standard Business Plan created.")

        # 2. Create Beauty Parlour Tenant
        tenant = Tenant.query.filter_by(name="SmartGoNext Beauty Salon").first()
        if not tenant:
            tenant = Tenant(
                name="SmartGoNext Beauty Salon",
                status="active",
                subscription_plan_id=plan.id
            )
            db.session.add(tenant)
            db.session.commit()
            print("SmartGoNext Beauty Salon Tenant created.")

        # 3. Create Super Admin User
        super_admin = User.query.filter_by(email="superadmin@smartgonext.com").first()
        if not super_admin:
            super_admin = User(
                email="superadmin@smartgonext.com",
                role="SuperAdmin",
                status="active",
                tenant_id=None
            )
            super_admin.set_password("SuperAdmin123!")
            db.session.add(super_admin)
            print("Super Admin user created.")

        # 4. Create Beauty Parlour Admin User
        parlour_admin = User.query.filter_by(email="admin@smartgonext.com").first()
        if not parlour_admin:
            parlour_admin = User(
                email="admin@smartgonext.com",
                role="ParlourAdmin",
                status="active",
                tenant_id=tenant.id
            )
            parlour_admin.set_password("ParlourAdmin123!")
            db.session.add(parlour_admin)
            print("Parlour Admin user created.")

        # 5. Create Default Settings
        settings = TenantSetting.query.filter_by(tenant_id=tenant.id).first()
        if not settings:
            settings = TenantSetting(
                tenant_id=tenant.id,
                tax_name="GST",
                tax_rate=18.00,
                currency="INR",
                receipt_header="Welcome to SmartGoNext Beauty Salon!",
                receipt_footer="Thank you for visiting us. Have a wonderful day!"
            )
            db.session.add(settings)
            print("Default settings created.")

        db.session.commit()
        print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
