import unittest
from unittest.mock import patch

import psycopg

from app.api.v1 import routes_vendor


class VendorRouteTest(unittest.TestCase):
    def test_create_vendor_preserves_database_operational_error(self):
        body = routes_vendor.CreateVendorRequest(
            business_name="Favour Fits",
            category="fashion",
        )

        with patch.object(
            routes_vendor,
            "create_vendor",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_vendor.create_vendor_endpoint(body)

    def test_get_vendor_preserves_database_operational_error(self):
        with patch.object(
            routes_vendor,
            "get_vendor_by_id",
            side_effect=psycopg.OperationalError("connection timeout"),
        ):
            with self.assertRaises(psycopg.OperationalError):
                routes_vendor.get_vendor_endpoint("vendor_123")


if __name__ == "__main__":
    unittest.main()
