import unittest
from unittest.mock import patch

from app import main


class MainConfigTest(unittest.TestCase):
    def test_allowed_origins_are_explicit_for_cookie_credentials(self):
        with patch.object(main.settings, "frontend_base_url", "https://proofpay-ai.vercel.app/"):
            origins = main.get_allowed_origins()

        self.assertIn("http://localhost:3000", origins)
        self.assertIn("http://127.0.0.1:3000", origins)
        self.assertIn("https://proofpay-ai.vercel.app", origins)
        self.assertNotIn("*", origins)


if __name__ == "__main__":
    unittest.main()
