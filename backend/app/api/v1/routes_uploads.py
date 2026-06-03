import re
import uuid
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings

router = APIRouter(prefix="/api/v1", tags=["Uploads"])

UPLOAD_DIR = Path("uploads")
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
UPLOAD_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$")


def _is_supported_image_url(image_url: str) -> bool:
    parsed = urlparse(image_url)
    return (
        parsed.scheme in {"http", "https"}
        and bool(parsed.netloc)
        and image_url.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png", ".webp"))
    ) or image_url.startswith("/images/")


def _absolute_backend_url(path: str) -> str:
    return f"{settings.backend_base_url.rstrip('/')}/{path.lstrip('/')}"


def _validate_content_type(content_type: str | None) -> str:
    normalized = (content_type or "").split(";")[0].strip().lower()
    if normalized not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_IMAGE_TYPE",
                "message": "Only JPEG, PNG, and WebP images are supported.",
            },
        )
    return normalized


def _validate_upload_id(upload_id: str) -> str:
    if not UPLOAD_ID_PATTERN.fullmatch(upload_id):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_UPLOAD_ID", "message": "Invalid upload id."},
        )
    return upload_id


@router.post("/uploads/image", status_code=201)
async def create_image_upload(request: Request):
    """
    Minimal hackathon upload contract. If image_url is provided, validate and
    echo it. Otherwise return a one-step upload URL for raw image bytes.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    image_url = str(body.get("image_url") or "").strip()
    if image_url and not _is_supported_image_url(image_url):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_IMAGE_URL",
                "message": "Use an http(s) image URL ending in jpg, jpeg, png, or webp.",
            },
        )

    if image_url:
        return {
            "image_url": image_url,
            "storage": "external_url",
        }

    content_type = _validate_content_type(str(body.get("content_type") or ""))
    extension = ALLOWED_IMAGE_TYPES[content_type]
    upload_id = f"{uuid.uuid4().hex}{extension}"

    return {
        "upload_url": _absolute_backend_url(f"/api/v1/uploads/image/{upload_id}"),
        "upload_method": "PUT",
        "image_url": _absolute_backend_url(f"/uploads/{upload_id}"),
        "upload_id": upload_id,
        "max_size_bytes": MAX_IMAGE_BYTES,
        "accepted_content_types": list(ALLOWED_IMAGE_TYPES.keys()),
        "storage": "proofpay-local",
    }


@router.put("/uploads/image/{upload_id}")
async def store_uploaded_image(upload_id: str, request: Request):
    upload_id = _validate_upload_id(upload_id)
    _validate_content_type(request.headers.get("content-type"))

    image_bytes = await request.body()
    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail={"code": "EMPTY_IMAGE", "message": "Image file is empty."},
        )

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={"code": "IMAGE_TOO_LARGE", "message": "Image must be 5MB or smaller."},
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / upload_id).write_bytes(image_bytes)

    return {
        "image_url": _absolute_backend_url(f"/uploads/{upload_id}"),
        "storage": "proofpay-local",
    }
