# backend/app/services/receipt_service.py

import logging
import os
from datetime import datetime
from pathlib import Path

from app.db.connection import get_connection
from app.services.payment_request_service import amount_kobo_to_naira

logger = logging.getLogger("proofpay.receipts")

RECEIPT_DIR = Path("/tmp")


def _format_naira(amount: float) -> str:
    return f"₦{amount:,.2f}"


def _format_receipt_date(value) -> str:
    if not value:
        return "Pending"
    if hasattr(value, "strftime"):
        return value.strftime("%B %d, %Y at %I:%M %p")
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.strftime("%B %d, %Y at %I:%M %p")
    except ValueError:
        return str(value)


def get_payment_request_full(payment_request_id: str) -> dict | None:
    """Get full payment request with vendor details."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            pr.id,
            pr.vendor_id,
            pr.item_name,
            pr.item_description,
            pr.amount_kobo,
            pr.currency,
            pr.buyer_name,
            pr.kora_reference,
            pr.status,
            pr.trust_score_at_creation,
            pr.created_at,
            tx.paid_at,
            v.business_name
        FROM payment_requests pr
        JOIN vendors v ON pr.vendor_id = v.id
        LEFT JOIN LATERAL (
            SELECT paid_at
            FROM transactions
            WHERE payment_request_id = pr.id
              AND paid_at IS NOT NULL
            ORDER BY paid_at DESC
            LIMIT 1
        ) tx ON true
        WHERE pr.id = %s
        """,
        (payment_request_id,)
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return dict(row)


def generate_receipt_pdf(payment_request_id: str) -> str | None:
    """
    Generate a PDF receipt for a payment.
    Returns the file path if successful, None otherwise.
    """
    payment = get_payment_request_full(payment_request_id)
    if not payment:
        logger.warning("Receipt generation failed: payment not found payment_id=%s", payment_request_id)
        return None

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        logger.warning("Receipt generation skipped because reportlab is unavailable: %s", exc)
        return None

    kora_reference = payment["kora_reference"]
    receipt_path = RECEIPT_DIR / f"{kora_reference}_receipt.pdf"

    try:
        # Create PDF document
        doc = SimpleDocTemplate(
            str(receipt_path),
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=6,
            alignment=1,  # Center
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=12,
            textColor=colors.HexColor("#374151"),
            spaceAfter=4,
            spaceBefore=4,
        )
        normal_style = ParagraphStyle(
            "CustomNormal",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#4B5563"),
            spaceAfter=2,
        )
        footer_style = ParagraphStyle(
            "CustomFooter",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#9CA3AF"),
            alignment=1,
        )

        # Content
        elements = []

        # Header
        elements.append(Paragraph("ProofPay AI", title_style))
        elements.append(Paragraph("Payment Receipt", heading_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Payment Details Table
        payment_data = [
            ["Payment Reference:", kora_reference],
            ["Status:", payment["status"].upper()],
            ["Date:", _format_receipt_date(payment.get("paid_at"))],
        ]
        payment_table = Table(payment_data, colWidths=[2.5 * inch, 2.5 * inch])
        payment_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                    ("TEXTCOLOR", (1, 0), (-1, -1), colors.HexColor("#1F2937")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#E5E7EB")),
                ]
            )
        )
        elements.append(payment_table)
        elements.append(Spacer(1, 0.15 * inch))

        # Vendor & Buyer Info
        elements.append(Paragraph("Seller Information", heading_style))
        vendor_data = [
            ["Business Name:", payment["business_name"]],
        ]
        vendor_table = Table(vendor_data, colWidths=[2.5 * inch, 2.5 * inch])
        vendor_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                    ("TEXTCOLOR", (1, 0), (-1, -1), colors.HexColor("#1F2937")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elements.append(vendor_table)
        elements.append(Spacer(1, 0.15 * inch))

        if payment["buyer_name"]:
            elements.append(Paragraph("Buyer Information", heading_style))
            buyer_data = [
                ["Name:", payment["buyer_name"]],
            ]
            buyer_table = Table(buyer_data, colWidths=[2.5 * inch, 2.5 * inch])
            buyer_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                        ("TEXTCOLOR", (1, 0), (-1, -1), colors.HexColor("#1F2937")),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )
            elements.append(buyer_table)
            elements.append(Spacer(1, 0.15 * inch))

        # Item Details
        elements.append(Paragraph("Transaction Details", heading_style))
        item_data = [
            ["Item:", payment["item_name"]],
            ["Amount:", _format_naira(amount_kobo_to_naira(payment["amount_kobo"]))],
            ["Currency:", payment["currency"]],
        ]
        if payment["trust_score_at_creation"] is not None:
            item_data.append(["Trust Score:", str(payment["trust_score_at_creation"])])

        item_table = Table(item_data, colWidths=[2.5 * inch, 2.5 * inch])
        item_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                    ("TEXTCOLOR", (1, 0), (-1, -1), colors.HexColor("#1F2937")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LINEABOVE", (0, 0), (-1, 0), 1, colors.HexColor("#E5E7EB")),
                    ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#E5E7EB")),
                ]
            )
        )
        elements.append(item_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Footer
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph("✓ Verified by Kora", footer_style))
        elements.append(Paragraph("Powered by ProofPay AI", footer_style))

        # Build PDF
        doc.build(elements)
        logger.info("Receipt generated successfully payment_id=%s kora_ref=%s path=%s", 
                   payment_request_id, kora_reference, receipt_path)
        return str(receipt_path)

    except Exception as e:
        logger.error(
            "Receipt generation failed payment_id=%s kora_ref=%s error=%s",
            payment_request_id,
            kora_reference,
            str(e),
        )
        return None
