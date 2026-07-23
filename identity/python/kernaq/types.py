"""
Response model classes for the Kernaq Identity API.
Shapes confirmed against the live API spec (OpenAPI 1.0.0, July 2026).
All fields are read-only frozen dataclass instances built from raw API JSON.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, List, Optional


@dataclass(frozen=True)
class ExtractedFields:
    first_name:       Optional[str] = None
    last_name:        Optional[str] = None
    document_number:  Optional[str] = None
    date_of_birth:    Optional[str] = None
    expiry_date:      Optional[str] = None
    country:          Optional[str] = None
    raw_fields:       dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ExtractedFields":
        return cls(
            first_name      = d.get("first_name"),
            last_name       = d.get("last_name"),
            document_number = d.get("document_number"),
            date_of_birth   = d.get("date_of_birth"),
            expiry_date     = d.get("expiry_date"),
            country         = d.get("country"),
            raw_fields      = d.get("raw_fields") or {},
        )


@dataclass(frozen=True)
class VerificationDocument:
    valid:          bool
    type:           str
    extracted_data: Optional[ExtractedFields] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationDocument":
        ed = d.get("extracted_data")
        return cls(
            valid          = d.get("valid", False),
            type           = d.get("type", ""),
            extracted_data = ExtractedFields.from_dict(ed) if ed else None,
        )


@dataclass(frozen=True)
class VerificationFace:
    matched:    bool
    confidence: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationFace":
        return cls(matched=d.get("matched", False), confidence=d.get("confidence", 0.0))


@dataclass(frozen=True)
class VerificationLiveness:
    passed: bool

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationLiveness":
        return cls(passed=d.get("passed", False))


@dataclass(frozen=True)
class VerificationRisk:
    level: str  # "low" | "medium" | "high" | "unknown"

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationRisk":
        return cls(level=d.get("level", "unknown"))


# Machine-readable failure reason values — set when status == "failed".
FailureReason = str  # "pipeline_timeout" | "pipeline_error" | "face_mismatch" |
                     # "liveness_failed" | "document_invalid" | "high_risk" | "fraud_detected"

VerificationStatus = str  # "pending" | "processing" | "verified" | "failed" | "review"


@dataclass(frozen=True)
class VerificationResult:
    verification_id: str
    status:          VerificationStatus
    confidence:      float = 0.0
    # Set when status == "failed" — explains why without inspecting sub-entities.
    failure_reason:  Optional[FailureReason] = None
    document:        Optional[VerificationDocument] = None
    face:            Optional[VerificationFace]     = None
    liveness:        Optional[VerificationLiveness] = None
    risk:            Optional[VerificationRisk]     = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationResult":
        doc  = d.get("document")
        face = d.get("face")
        liv  = d.get("liveness")
        risk = d.get("risk")
        return cls(
            verification_id = d["verification_id"],
            status          = d.get("status", ""),
            confidence      = d.get("confidence", 0.0),
            failure_reason  = d.get("failure_reason"),
            document        = VerificationDocument.from_dict(doc)  if doc  else None,
            face            = VerificationFace.from_dict(face)      if face else None,
            liveness        = VerificationLiveness.from_dict(liv)   if liv  else None,
            risk            = VerificationRisk.from_dict(risk)      if risk else None,
        )


@dataclass(frozen=True)
class VerificationSummary:
    verification_id: str
    reference:       str
    status:          VerificationStatus
    confidence:      float = 0.0
    failure_reason:  Optional[FailureReason] = None
    created_at:      str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationSummary":
        return cls(
            verification_id = d["verification_id"],
            reference       = d.get("reference", ""),
            status          = d.get("status", ""),
            confidence      = d.get("confidence", 0.0),
            failure_reason  = d.get("failure_reason"),
            created_at      = d.get("created_at", ""),
        )


@dataclass(frozen=True)
class ListVerificationsResult:
    verifications: List[VerificationSummary]
    next_cursor:   Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ListVerificationsResult":
        return cls(
            verifications = [VerificationSummary.from_dict(v) for v in d.get("verifications", [])],
            next_cursor   = d.get("next_cursor"),
        )


@dataclass(frozen=True)
class BoundingBox:
    left:   float
    top:    float
    width:  float
    height: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "BoundingBox":
        return cls(left=d["left"], top=d["top"], width=d["width"], height=d["height"])


@dataclass(frozen=True)
class FaceDetectResult:
    detected:       bool
    confidence:     float
    bounding_box:   Optional[BoundingBox] = None
    age_range_low:  Optional[int]         = None
    age_range_high: Optional[int]         = None
    gender:         Optional[str]         = None
    attributes:     dict[str, Any]        = field(default_factory=dict)
    processed_at:   str                   = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceDetectResult":
        bb = d.get("bounding_box")
        return cls(
            detected       = d.get("detected", False),
            confidence     = d.get("confidence", 0.0),
            bounding_box   = BoundingBox.from_dict(bb) if bb else None,
            age_range_low  = d.get("age_range_low"),
            age_range_high = d.get("age_range_high"),
            gender         = d.get("gender"),
            attributes     = d.get("attributes") or {},
            processed_at   = d.get("processed_at", ""),
        )


@dataclass(frozen=True)
class FaceMatchResult:
    matched:      bool
    confidence:   float
    processed_at: str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceMatchResult":
        return cls(
            matched      = d.get("matched", False),
            confidence   = d.get("confidence", 0.0),
            processed_at = d.get("processed_at", ""),
        )


@dataclass(frozen=True)
class LivenessDetails:
    """Movement analysis data from a liveness check."""
    mode:              str   = ""
    detected_frames:   int   = 0
    extracted_frames:  int   = 0
    delta_yaw:         float = 0.0
    delta_pitch:       float = 0.0
    delta_roll:        float = 0.0
    movement_detected: bool  = False

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "LivenessDetails":
        return cls(
            mode              = d.get("mode", ""),
            detected_frames   = d.get("detected_frames", 0),
            extracted_frames  = d.get("extracted_frames", 0),
            delta_yaw         = d.get("delta_yaw", 0.0),
            delta_pitch       = d.get("delta_pitch", 0.0),
            delta_roll        = d.get("delta_roll", 0.0),
            movement_detected = d.get("movement_detected", False),
        )


@dataclass(frozen=True)
class LivenessResult:
    passed:       bool
    confidence:   float = 0.0
    details:      Optional[LivenessDetails] = None
    processed_at: str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "LivenessResult":
        det = d.get("details")
        return cls(
            passed       = d.get("passed", False),
            confidence   = d.get("confidence", 0.0),
            details      = LivenessDetails.from_dict(det) if det else None,
            processed_at = d.get("processed_at", ""),
        )


@dataclass(frozen=True)
class ExtractDocumentResult:
    document_type: str
    fields:        ExtractedFields
    raw_lines:     List[str]
    processed_at:  str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ExtractDocumentResult":
        return cls(
            document_type = d.get("document_type", ""),
            fields        = ExtractedFields.from_dict(d.get("fields") or {}),
            raw_lines     = d.get("raw_lines") or [],
            processed_at  = d.get("processed_at", ""),
        )


@dataclass(frozen=True)
class ValidateDocumentResult:
    valid:         bool
    document_type: str
    flags:         List[str]
    processed_at:  str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ValidateDocumentResult":
        return cls(
            valid         = d.get("valid", False),
            document_type = d.get("document_type", ""),
            flags         = d.get("flags") or [],
            processed_at  = d.get("processed_at", ""),
        )


# ── Webhooks ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Webhook:
    id:         str
    url:        str
    events:     List[str]
    is_active:  bool
    created_at: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Webhook":
        return cls(
            id         = d["id"],
            url        = d.get("url", ""),
            events     = d.get("events") or [],
            is_active  = d.get("is_active", True),
            created_at = d.get("created_at", ""),
        )


@dataclass(frozen=True)
class WebhookCreatedResponse:
    id:         str
    url:        str
    events:     List[str]
    is_active:  bool
    secret:     str  # shown once — store securely
    created_at: str
    message:    str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "WebhookCreatedResponse":
        return cls(
            id         = d["id"],
            url        = d.get("url", ""),
            events     = d.get("events") or [],
            is_active  = d.get("is_active", True),
            secret     = d.get("secret", ""),
            created_at = d.get("created_at", ""),
            message    = d.get("message", ""),
        )


@dataclass(frozen=True)
class WebhookDelivery:
    id:            str
    event_type:    str
    event_id:      str
    status:        str  # "pending" | "delivered" | "failed" | "abandoned"
    attempts:      int
    max_attempts:  int
    next_attempt:  Optional[str] = None
    last_error:    Optional[str] = None
    delivered_at:  Optional[str] = None
    created_at:    str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "WebhookDelivery":
        return cls(
            id           = d["id"],
            event_type   = d.get("event_type", ""),
            event_id     = d.get("event_id", ""),
            status       = d.get("status", ""),
            attempts     = d.get("attempts", 0),
            max_attempts = d.get("max_attempts", 5),
            next_attempt = d.get("next_attempt"),
            last_error   = d.get("last_error"),
            delivered_at = d.get("delivered_at"),
            created_at   = d.get("created_at", ""),
        )


# ── Capture sessions ──────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CaptureSessionResult:
    session_id:  str
    token:       str  # 64-char hex — pass to capture SDK as X-Capture-Token
    nonce:       str  # 32-char hex — pass as X-Capture-Nonce, single-use
    expires_at:  str
    ttl_seconds: int
    message:     str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "CaptureSessionResult":
        return cls(
            session_id  = d.get("session_id", ""),
            token       = d.get("token", ""),
            nonce       = d.get("nonce", ""),
            expires_at  = d.get("expires_at", ""),
            ttl_seconds = d.get("ttl_seconds", 900),
            message     = d.get("message", ""),
        )


# ── Project settings ──────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ProjectSettings:
    project_id:                 str
    risk_threshold_medium:      float
    risk_threshold_high:        float
    max_attempts_per_reference: int
    require_capture_token:      bool
    enable_cross_project_dedup: bool
    created_at:                 str
    updated_at:                 str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ProjectSettings":
        return cls(
            project_id                 = d.get("project_id", ""),
            risk_threshold_medium      = d.get("risk_threshold_medium", 20.0),
            risk_threshold_high        = d.get("risk_threshold_high", 60.0),
            max_attempts_per_reference = d.get("max_attempts_per_reference", 3),
            require_capture_token      = d.get("require_capture_token", False),
            enable_cross_project_dedup = d.get("enable_cross_project_dedup", False),
            created_at                 = d.get("created_at", ""),
            updated_at                 = d.get("updated_at", ""),
        )
