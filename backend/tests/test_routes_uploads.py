import unittest

from fastapi import HTTPException

from app.api.v1 import routes_uploads


class FakeRequest:
    def __init__(self, body):
        self.body = body

    async def json(self):
        return self.body


class UploadsRouteTest(unittest.IsolatedAsyncioTestCase):
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

    async def test_create_image_upload_rejects_missing_url(self):
        with self.assertRaises(HTTPException) as context:
            await routes_uploads.create_image_upload(FakeRequest({}))

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "VALIDATION_ERROR")

    async def test_create_image_upload_rejects_non_image_url(self):
        with self.assertRaises(HTTPException) as context:
            await routes_uploads.create_image_upload(
                FakeRequest({"image_url": "https://example.com/page"})
            )

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail["code"], "UNSUPPORTED_IMAGE_URL")


if __name__ == "__main__":
    unittest.main()
