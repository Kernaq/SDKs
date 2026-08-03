"""
Kernaq Identity SDK — process-and-forget model.

RECEIVE → PROCESS → RETURN → FORGET.

Every call is synchronous. The result is returned in the HTTP response body.
Nothing is stored on Kernaq servers — not documents, selfies, or results.
"""
from __future__ import annotations

from typing import Any, Optional

from ._http import HttpClient, FileInput
from .types import (
    VerifyResult,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    ExtractDocumentResult,
    ValidateDocumentResult,
    UsageSummary,
)


# ── Resources ─────────────────────────────────────────────────────────────────

class VerifyResource:
    """Full synchronous KYC pipeline — POST /v1/verify and /v1/verify/sandbox."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def run(
        self,
        *,
        document:       FileInput,
        selfie:         FileInput,
        document_type:  str = "national_id",
        country:        str = "KEN",
        document_name:  str = "document.jpg",
        selfie_name:    str = "selfie.jpg",
        # Liveness: supply video OR all three frames
        video:          Optional[FileInput] = None,
        video_name:     str = "liveness.mp4",
        frame1:         Optional[FileInput] = None,
        frame1_name:    str = "frame1.jpg",
        frame2:         Optional[FileInput] = None,
        frame2_name:    str = "frame2.jpg",
        frame3:         Optional[FileInput] = None,
        frame3_name:    str = "frame3.jpg",
    ) -> VerifyResult:
        """
        Full KYC pipeline (live mode). Deducts one credit.
        Blocks 3–8 seconds. Returns the result directly — nothing stored.

        Example::

            result = client.verify.run(
                document=open("id.jpg", "rb"),
                selfie=open("selfie.jpg", "rb"),
                video=open("liveness.mp4", "rb"),
                document_type="national_id",
                country="KEN",
            )
            if result.verdict == "pass":
                print(result.document_fields.name)
        """
        return VerifyResult.from_dict(
            self._submit("/verify", document, selfie, document_type, country,
                         document_name, selfie_name,
                         video, video_name, frame1, frame1_name,
                         frame2, frame2_name, frame3, frame3_name)
        )

    def sandbox(
        self,
        *,
        document:       FileInput,
        selfie:         FileInput,
        document_type:  str = "national_id",
        country:        str = "KEN",
        document_name:  str = "document.jpg",
        selfie_name:    str = "selfie.jpg",
        video:          Optional[FileInput] = None,
        video_name:     str = "liveness.mp4",
        frame1:         Optional[FileInput] = None,
        frame1_name:    str = "frame1.jpg",
        frame2:         Optional[FileInput] = None,
        frame2_name:    str = "frame2.jpg",
        frame3:         Optional[FileInput] = None,
        frame3_name:    str = "frame3.jpg",
    ) -> VerifyResult:
        """
        Full KYC pipeline (sandbox mode). Same pipeline, no billing.
        Use k_test_ API keys.
        """
        return VerifyResult.from_dict(
            self._submit("/verify/sandbox", document, selfie, document_type, country,
                         document_name, selfie_name,
                         video, video_name, frame1, frame1_name,
                         frame2, frame2_name, frame3, frame3_name)
        )

    def _submit(self, path, document, selfie, doc_type, country,
                doc_name, selfie_name, video, video_name,
                f1, f1n, f2, f2n, f3, f3n):
        fields = {"document_type": doc_type, "country": country}
        files = [
            ("document", document, doc_name),
            ("selfie",   selfie,   selfie_name),
        ]
        if video is not None:
            files.append(("video", video, video_name))
        elif f1 is not None and f2 is not None and f3 is not None:
            files += [
                ("frame1", f1, f1n),
                ("frame2", f2, f2n),
                ("frame3", f3, f3n),
            ]
        return self._http.upload(path, fields, files)


class DocumentsResource:
    """Standalone stateless document OCR endpoints."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def extract(
        self,
        *,
        document:      FileInput,
        document_name: str = "document.jpg",
        document_type: str = "",
        country:       str = "",
    ) -> ExtractDocumentResult:
        """Extract structured fields from an ID (name, DOB, document number, expiry). Nothing stored."""
        fields: dict[str, str] = {}
        if document_type: fields["document_type"] = document_type
        if country:       fields["country"]       = country
        return ExtractDocumentResult.from_dict(
            self._http.upload("/documents/extract", fields, [("document", document, document_name)])
        )

    def validate(
        self,
        *,
        document:      FileInput,
        document_name: str = "document.jpg",
        document_type: str = "",
        country:       str = "",
    ) -> ValidateDocumentResult:
        """Validate document fields (expiry, required fields present). Nothing stored."""
        fields: dict[str, str] = {}
        if document_type: fields["document_type"] = document_type
        if country:       fields["country"]       = country
        return ValidateDocumentResult.from_dict(
            self._http.upload("/documents/validate", fields, [("document", document, document_name)])
        )


class FaceResource:
    """Standalone stateless face detection and matching."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def detect(self, *, image: FileInput, image_name: str = "image.jpg") -> FaceDetectResult:
        """Detect primary face in image and return attributes. Nothing stored."""
        return FaceDetectResult.from_dict(
            self._http.upload("/face/detect", {}, [("image", image, image_name)])
        )

    def match(
        self,
        *,
        face_a:       FileInput,
        face_b:       FileInput,
        face_a_name:  str = "face_a.jpg",
        face_b_name:  str = "face_b.jpg",
    ) -> FaceMatchResult:
        """Compare two faces. Returns matched + confidence score. Nothing stored."""
        return FaceMatchResult.from_dict(
            self._http.upload(
                "/face/match", {},
                [("face_a", face_a, face_a_name), ("face_b", face_b, face_b_name)],
            )
        )


class LivenessResource:
    """Standalone stateless liveness detection."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def check(
        self,
        *,
        video:        Optional[FileInput] = None,
        video_name:   str = "liveness.mp4",
        frame1:       Optional[FileInput] = None,
        frame1_name:  str = "frame1.jpg",
        frame2:       Optional[FileInput] = None,
        frame2_name:  str = "frame2.jpg",
        frame3:       Optional[FileInput] = None,
        frame3_name:  str = "frame3.jpg",
    ) -> LivenessResult:
        """
        Check for a live real person. Supply video OR all three frames.
        Nothing stored.
        """
        files = []
        if video is not None:
            files.append(("video", video, video_name))
        elif frame1 is not None and frame2 is not None and frame3 is not None:
            files += [
                ("frame1", frame1, frame1_name),
                ("frame2", frame2, frame2_name),
                ("frame3", frame3, frame3_name),
            ]
        else:
            raise ValueError("Supply either video or all three frame files (frame1, frame2, frame3)")
        return LivenessResult.from_dict(self._http.upload("/liveness/check", {}, files))


class UsageResource:
    """Non-PII usage statistics for billing and dashboards."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def get(self, *, days: int = 30) -> UsageSummary:
        """Return aggregate call counts. No personal data ever appears here."""
        return UsageSummary.from_dict(self._http.get(f"/usage?days={days}"))


# ── Main client ───────────────────────────────────────────────────────────────

class Kernaq:
    """
    Kernaq Identity API client — process-and-forget model.

    Usage::

        from kernaq import Kernaq

        client = Kernaq()                       # reads KERNAQ_API_KEY from env
        client = Kernaq(api_key="k_test_...")   # explicit

        # Full KYC pipeline — synchronous, result in 3-8s
        result = client.verify.run(
            document=open("id.jpg", "rb"),
            selfie=open("selfie.jpg", "rb"),
            video=open("liveness.mp4", "rb"),
            document_type="national_id",
            country="KEN",
        )
        print(result.verdict)           # "pass" | "fail" | "review"
        print(result.face_match)        # True
        print(result.score)             # 8
        print(result.document_fields.name)

        # Sandbox (no billing)
        result = client.verify.sandbox(document=..., selfie=..., video=...)

        # Standalone OCR
        fields = client.documents.extract(document=open("id.jpg", "rb"))
        print(fields.document_number)

        # Face match
        match = client.face.match(face_a=open("doc.jpg","rb"), face_b=open("selfie.jpg","rb"))
        print(match.matched, match.confidence)

        # Usage stats
        stats = client.usage.get(days=30)
        print(stats.total_calls)
    """

    def __init__(
        self,
        api_key:  Optional[str] = None,
        base_url: Optional[str] = None,
        timeout:  float         = 120.0,
    ) -> None:
        http = HttpClient(api_key=api_key, base_url=base_url, timeout=timeout)
        self.verify    = VerifyResource(http)
        self.documents = DocumentsResource(http)
        self.face      = FaceResource(http)
        self.liveness  = LivenessResource(http)
        self.usage     = UsageResource(http)
