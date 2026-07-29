from app import create_app
from app.database import db
from sqlalchemy import text

def run_migration():
    app = create_app()
    with app.app_context():
        print("Migrating tenant_settings MySQL table columns...")
        
        # Add currency_code column if missing
        try:
            db.session.execute(text("ALTER TABLE tenant_settings ADD COLUMN currency_code VARCHAR(10) NOT NULL DEFAULT 'INR';"))
            db.session.commit()
            print("Successfully added currency_code column.")
        except Exception as e:
            db.session.rollback()
            print(f"currency_code column notice: {str(e)}")

        # Add language column if missing
        try:
            db.session.execute(text("ALTER TABLE tenant_settings ADD COLUMN language VARCHAR(30) NOT NULL DEFAULT 'English';"))
            db.session.commit()
            print("Successfully added language column.")
        except Exception as e:
            db.session.rollback()
            print(f"language column notice: {str(e)}")

        print("Migration complete!")

if __name__ == "__main__":
    run_migration()
