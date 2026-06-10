import unittest

from app.api.v1 import routes_ws


class FakeWebSocket:
    def __init__(self):
        self.messages = []

    async def send_json(self, payload):
        self.messages.append(payload)


class WebSocketRouteTest(unittest.IsolatedAsyncioTestCase):
    async def asyncTearDown(self):
        routes_ws.active_connections.clear()

    async def test_notify_ws_sends_status_to_active_payment_connection(self):
        websocket = FakeWebSocket()
        routes_ws.active_connections["req_123"] = websocket

        await routes_ws.notify_ws("req_123", "paid")

        self.assertEqual(websocket.messages, [{"status": "paid"}])

    async def test_notify_ws_ignores_missing_connection(self):
        await routes_ws.notify_ws("missing", "paid")

        self.assertEqual(routes_ws.active_connections, {})


if __name__ == "__main__":
    unittest.main()
