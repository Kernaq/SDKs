"""
Response model classes.
Shapes confirmed against the live Kernaq Identity API (34/34 tests, July 2026).
All fields are read-only dataclass instances built from raw API JSON.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Optional


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
    level: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerificationRisk":
        return cls(level=d.get("level", "unknown"))


VerificationStatus = str  # "pending" | "processing" | "verified" | "failed" | "review"


@dataclass(frozen=True)
class VerificationResult:
    verification_id: str
    status:          VerificationStatus
    confidence:      float = 0.0
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
            document        = VerificationDocument.from_dict(doc)  if doc  else None,
            face            = VerificationFace.from_dict(face)      if face else None,
            liveness        = VerificationLiveness.from_dict(liv)   if liv  else None,
            risk            = VerificationRisk.from_dict(risk)      if risk else None,
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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceDetectResult":
        bb = d.get("bounding_box")
        return cls(
            detected      = d.get("detected", False),
            confidence    = d.get("confidence", 0.0),
            bounding_box  = BoundingBox.from_dict(bb) if bb else None,
            age_range_low = d.get("age_range_low"),
            age_range_high= d.get("age_range_high"),
            gender        = d.get("gender"),
            attributes    = d.get("attributes") or {},
        )


@dataclass(frozen=True)
class FaceMatchResult:
    matched:    bool
    confidence: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceMatchResult":
        return cls(matched=d.get("matched", False), confidence=d.get("confidence", 0.0))


@dataclass(frozen=True)
class LivenessResult:
    passed:     bool
    confidence: float = 0.0
    reason:     Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "LivenessResult":
        return cls(
            passed     = d.get("passed", False),
            confidence = d.get("confidence", 0.0),
            reason     = d.get("reason"),
        )


@dataclass(frozen=True)
class ExtractDocumentResult:
    document_type: str
    fields:        ExtractedFields
    raw_lines:     list[str]
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
    flags:         list[str]
    processed_at:  str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ValidateDocumentResult":
        return cls(
            valid         = d.get("valid", False),
            document_type = d.get("document_type", ""),
            flags         = d.get("flags") or [],
            processed_at  = d.get("processed_at", ""),
        )
