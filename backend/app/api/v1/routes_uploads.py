from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/v1", tags=["Uploads"])


def _is_supported_image_url(image_url: str) -> bool:
    parsed = urlparse(image_url)
    return (
        parsed.scheme in {"http", "https"}
        and bool(parsed.netloc)
        and image_url.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png", ".webp"))
    ) or image_url.startswith("/images/")


@router.post("/uploads/image", status_code=201)
async def create_image_upload(request: Request):
    """
    Minimal hackathon upload contract.

    For the MVP, the frontend can upload to Supabase Storage or use a vetted
    dummy image, then send the final image URL here for validation.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    image_url = str(body.get("image_url") or "").strip()
    if not image_url:
        raise HTTPException(
            status_code=400,
            detail={"code": "VALIDATION_ERROR", "message": "image_url is required."},
        )

    if not _is_supported_image_url(image_url):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_IMAGE_URL",
                "message": "Use an http(s) image URL ending in jpg, jpeg, png, or webp.",
            },
        )

    return {
        "image_url": image_url,
        "storage": "external_url",
    }
