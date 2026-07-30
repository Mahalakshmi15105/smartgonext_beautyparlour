import os
import sys
import unittest
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.database import db
from app.models.global_models import Tenant
from app.models.user import User
from app.models.customer import Customer
from app.models.whatsapp import WhatsAppSetting, WhatsAppCampaign, WhatsAppCampaignRecipient
from app.services.campaign_service import CampaignService
from app.services.whatsapp_service import WhatsAppService


class TestWhatsAppMultiTenantIsolation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        cls.app_context.pop()

    def setUp(self):
        # Create Test Salon A (tenant_id = 101) and Test Salon B (tenant_id = 102)
        # Create Test Salon A (tenant_id = 101) and Test Salon B (tenant_id = 102)
        from app.models.global_models import SubscriptionPlan
        plan = SubscriptionPlan.query.first()
        plan_id = plan.id if plan else 1

        self.tenant_a = Tenant.query.get(101)
        if not self.tenant_a:
            self.tenant_a = Tenant(id=101, name="Salon A", subscription_plan_id=plan_id)
            db.session.add(self.tenant_a)

        self.tenant_b = Tenant.query.get(102)
        if not self.tenant_b:
            self.tenant_b = Tenant(id=102, name="Salon B", subscription_plan_id=plan_id)
            db.session.add(self.tenant_b)

        db.session.commit()

        # Clear Campaigns and Recipient queue to avoid foreign key constraints
        WhatsAppCampaignRecipient.query.filter(WhatsAppCampaignRecipient.tenant_id.in_([101, 102])).delete()
        WhatsAppCampaign.query.filter(WhatsAppCampaign.tenant_id.in_([101, 102])).delete()

        # Seed Customers for Salon A
        Customer.query.filter_by(tenant_id=101).delete()
        c_a1 = Customer(tenant_id=101, first_name="Arun", phone="9876543210")
        c_a2 = Customer(tenant_id=101, first_name="Priya", phone="9876543211")
        c_a3 = Customer(tenant_id=101, first_name="Karthik", phone="9876543212")
        db.session.add_all([c_a1, c_a2, c_a3])

        # Seed Customers for Salon B
        Customer.query.filter_by(tenant_id=102).delete()
        c_b1 = Customer(tenant_id=102, first_name="Rahul", phone="9998887770")
        c_b2 = Customer(tenant_id=102, first_name="Sneha", phone="9998887771")
        db.session.add_all([c_b1, c_b2])

        db.session.commit()

    def test_tenant_customer_fetch_isolation(self):
        """Verifies Salon A campaign target customers fetch ONLY Salon A customers."""
        from flask import g
        g.parlour_id = 101
        target_a = CampaignService.fetch_target_customers(tenant_id=101, audience_type="ALL")
        
        g.parlour_id = 102
        target_b = CampaignService.fetch_target_customers(tenant_id=102, audience_type="ALL")

        names_a = [c.first_name for c in target_a]
        names_b = [c.first_name for c in target_b]

        print(f"\n[VERIFICATION] Salon A Target Customers: {names_a}")
        print(f"[VERIFICATION] Salon B Target Customers: {names_b}")

        self.assertEqual(len(target_a), 3)
        self.assertIn("Arun", names_a)
        self.assertIn("Priya", names_a)
        self.assertNotIn("Rahul", names_a)

        self.assertEqual(len(target_b), 2)
        self.assertIn("Rahul", names_b)
        self.assertIn("Sneha", names_b)
        self.assertNotIn("Arun", names_b)

    def test_campaign_queue_creation_and_batch_processing(self):
        """Verifies Campaign Service creates queue and dispatches batch dispatches without errors."""
        from flask import g
        g.parlour_id = 101
        campaign_data = {
            "title": "Salon A Weekend Offer",
            "template_type": "TEXT_ONLY",
            "offer_message": "Enjoy 20% OFF on all hair spa services this weekend!",
            "audience_type": "ALL"
        }

        campaign = CampaignService.create_campaign_and_queue(tenant_id=101, user_id=1, campaign_data=campaign_data)
        self.assertEqual(campaign.total_target_customers, 3)
        self.assertEqual(campaign.status, "QUEUED")

        # Process Batch
        batch_res = CampaignService.process_campaign_batch(campaign.id, batch_size=10)
        print(f"[VERIFICATION] Batch Processing Result: {batch_res}")

        self.assertEqual(batch_res["status"], "COMPLETED")
        self.assertEqual(batch_res["sent_count"], 3)
        self.assertEqual(batch_res["failed_count"], 0)


if __name__ == "__main__":
    unittest.main()
