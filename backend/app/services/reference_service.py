# backend/app/services/reference_service.py

import random
import string
from datetime import datetime, timezone


def generate_kora_reference() -> str:
    """
    Format: PPAY-YYYYMMDD-XXXXXXXX
    Example: PPAY-20260519-7H2KQ9AB
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = "".join(
        random.choices(string.ascii_uppercase + string.digits, k=8)
    )
    return f"PPAY-{date_str}-{random_part}"


def generate_public_slug() -> str:
    """
    Format: ppai_XXXXXXXX
    Example: ppai_7H2KQ9AB
    """
    random_part = "".join(
        random.choices(string.ascii_uppercase + string.digits, k=8)
    )
    return f"ppai_{random_part}"


def is_reference_unique(reference: str, conn) -> bool:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM payment_requests WHERE kora_reference = %s",
        (reference,)
    )
    return cursor.fetchone() is None


def is_slug_unique(slug: str, conn) -> bool:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM payment_requests WHERE public_slug = %s",
        (slug,)
    )
    return cursor.fetchone() is None


def generate_unique_reference(conn) -> str:
    for _ in range(10):
        ref = generate_kora_reference()
        if is_reference_unique(ref, conn):
            return ref
    raise ValueError("Could not generate a unique reference after 10 attempts")


def generate_unique_slug(conn) -> str:
    for _ in range(10):
        slug = generate_public_slug()
        if is_slug_unique(slug, conn):
            return slug
    raise ValueError("Could not generate a unique slug after 10 attempts")
