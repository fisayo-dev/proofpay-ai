import unittest
import asyncio
import json

import psycopg
from fastapi.exceptions import RequestValidationError

from app.core.error_handlers import (
    database_exception_handler,
    general_exception_handler,
    validation_exception_handler,
)


class ErrorHandlerTest(unittest.TestCase):
    def test_validation_errors_return_consistent_400_shape(self):
        exc = RequestValidationError([
            {"loc": ("body", "item_name"), "msg": "Field required"},
            {"loc": ("body", "amount_kobo"), "msg": "Input should be a valid integer"},
        ])

        response = asyncio.run(validation_exception_handler(None, exc))
        payload = json.loads(response.body)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(payload["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(
            payload["error"]["message"],
            "Request body failed validation.",
        )
        fields = [detail["field"] for detail in payload["error"]["details"]]
        self.assertIn("body -> item_name", fields)
        self.assertIn("body -> amount_kobo", fields)

    def test_general_errors_return_consistent_500_shape(self):
        response = asyncio.run(
            general_exception_handler(
                None,
                RuntimeError("database password leaked in raw error"),
            )
        )
        payload = json.loads(response.body)

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            payload,
            {
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Please try again.",
                    "details": {},
                }
            },
        )

    def test_database_errors_return_consistent_503_shape(self):
        response = asyncio.run(
            database_exception_handler(
                None,
                psycopg.OperationalError("connection timeout"),
            )
        )
        payload = json.loads(response.body)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            payload,
            {
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "ProofPay is having trouble connecting. Please try again.",
                    "details": {},
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
