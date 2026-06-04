import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

from app.api.v1 import routes_uploads


class FakeRequest:
    def __init__(
        self,
        body,
        content_type: str | None = None,
        base_url: str = "https://request.example.com/",
        headers: dict | None = None,
    ):
        self._body = body
        self.base_url = base_url
        self.headers = dict(headers or {})
        if content_type:
            self.headers["content-type"] = content_type

    async def json(self):
        if isinstance(self._body, dict):
            return self._body
        raise ValueError("Body is not JSON")

    async def body(self):
        return self._body


class UploadsRouteTest(unittest.IsolatedAsyncioTestCase):
    async def test_create_image_upload_returns_upload_url_for_file_data(self):
        with patch.object(routes_uploads.settings, "backend_base_url", "https://backend.example.com"):
            response = await routes_uploads.create_image_upload(
                FakeRequest({"filename": "black-hoodie.jpg", "content_type": "image/jpeg"})
            )

        self.assertEqual(response["upload_method"], "PUT")
        self.assertEqual(response["accepted_content_types"], ["image/jpeg", "image/png", "image/webp"])
        self.assertTrue(response["upload_url"].startswith("https://backend.example.com/api/v1/uploads/image/"))
        self.assertTrue(response["image_url"].startswith("https://backend.example.com/uploads/"))
        self.assertTrue(response["image_url"].endswith(".jpg"))

    async def test_create_image_upload_uses_request_origin_when_config_is_localhost(self):
        request = FakeRequest(
            {"filename": "black-hoodie.jpg", "content_type": "image/jpeg"},
            headers={
                "x-forwarded-proto": "https",
                "x-forwarded-host": "olatunjitobi-proofpay-ai-backend.hf.space",
            },
        )

        with patch.object(routes_uploads.settings, "backend_base_url", "http://localhost:8000"):
            response = await routes_uploads.create_image_upload(request)

        self.assertTrue(
            response["upload_url"].startswith(
                "https://olatunjitobi-proofpay-ai-backend.hf.space/api/v1/uploads/image/"
            )
        )
        self.assertTrue(
            response["image_url"].startswith(
                "https://olatunjitobi-proofpay-ai-backend.hf.space/uploads/"
            )
        )

    async def test_create_image_upload_accepts_external_image_url(self):
        response = await routes_uploads.create_image_upload(
            FakeRequest({"image_url": "https://example.com/black-hoodie.webp"})
        )

        self.assertEqual(response["image_url"], "https://example.com/black-hoodie.webp")
        self.assertEqual(response["storage"], "external_url")

    async def test_create_image_upload_accepts_local_product_image(self):
        response = await routes_uploads.create_image_upload(
            FakeRequest({"image_url": "/images/products/ceramic-mug.jpg"})
        )

        self.assertEqual(response["image_url"], "/images/products/ceramic-mug.jpg")

    async def test_create_image_upload_rejects_unsupported_file_type(self):
        with self.assertRaises(HTTPException) as context:
            await routes_uploads.create_image_upload(
                FakeRequest({"filename": "notes.txt", "content_type": "text/plain"})
            )

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "UNSUPPORTED_IMAGE_TYPE")

    async def test_create_image_upload_rejects_non_image_url(self):
        with self.assertRaises(HTTPException) as context:
            await routes_uploads.create_image_upload(
                FakeRequest({"image_url": "https://example.com/page"})
            )

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "UNSUPPORTED_IMAGE_URL")

    async def test_store_uploaded_image_writes_valid_image_bytes(self):
        upload_id = "demo-upload.jpg"
        upload_dir = Path("backend/.test_uploads")
        request = FakeRequest(b"\xff\xd8\xffdemo", "image/jpeg")

        with (
            patch.object(routes_uploads, "UPLOAD_DIR", upload_dir),
            patch.object(routes_uploads.settings, "backend_base_url", "https://backend.example.com"),
        ):
            response = await routes_uploads.store_uploaded_image(upload_id, request)
            uploaded = upload_dir / upload_id

        try:
            self.assertTrue(uploaded.exists())
            self.assertEqual(uploaded.read_bytes(), b"\xff\xd8\xffdemo")
            self.assertEqual(response["image_url"], "https://backend.example.com/uploads/demo-upload.jpg")
        finally:
            if uploaded.exists():
                uploaded.unlink()
            if upload_dir.exists():
                upload_dir.rmdir()

    async def test_store_uploaded_image_rejects_non_image_content_type(self):
        request = FakeRequest(b"not an image", "text/plain")

        with self.assertRaises(HTTPException) as context:
            await routes_uploads.store_uploaded_image("demo-upload.jpg", request)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "UNSUPPORTED_IMAGE_TYPE")

    async def test_store_uploaded_image_rejects_invalid_upload_id(self):
        request = FakeRequest(b"image", "image/jpeg")

        with self.assertRaises(HTTPException) as context:
            await routes_uploads.store_uploaded_image("../bad.jpg", request)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "INVALID_UPLOAD_ID")


if __name__ == "__main__":
    unittest.main()
