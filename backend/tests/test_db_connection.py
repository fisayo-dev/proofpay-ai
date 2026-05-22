import unittest
from unittest.mock import patch

from app.core.config import DB_QUERY_TIMEOUT_SECONDS
from app.db import connection


class DbConnectionTest(unittest.TestCase):
    def test_get_connection_uses_configured_connect_timeout(self):
        with patch.object(connection.psycopg, "connect") as connect:
            connection.get_connection()

        self.assertEqual(connect.call_args.kwargs["connect_timeout"], DB_QUERY_TIMEOUT_SECONDS)


if __name__ == "__main__":
    unittest.main()
