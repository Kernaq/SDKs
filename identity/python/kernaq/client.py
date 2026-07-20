"""Public Kernaq client — the only import most users need."""
from __future__ import annotations

import time
from typing import Any, BinaryIO, Callable, Optional, Union

from ._http import HttpClient, FileInput
from .exceptions import KernaqError
from .types import (
    VerificationResult,
    VerificationStatus,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    ExtractDocumentResult,
    ValidateDocumentResult,
)

_TERMINAL = {"verified", "failed", "review"}


# ── Resource classes ──────────────────────────────────────────────────────────

class VerificationsResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def submit(
        self,
        *,
        document:        FileInput,
        selfie:          FileInput,
        video:           FileInput,
        document_type:   str,
        country:         str,
        reference:       str,
        document_name:   str = "document.jpg",
        selfie_name:     str = "selfie.jpg",
        video_name:      str = "liveness.mp4",
        external_user_id: str = "",
    ) -> dict[str, Any]:
        """Submit a verification and return the 202 response immediately."""
        fields: dict[str, str] = {
            "document_type": document_type,
            "country":       country,
            "reference":     reference,
        }
        if external_user_id:
            fields["external_user_id"] = external_user_id

        return self._http.upload(
            "/verifications",
            fields,
            [
                ("document", document, document_name),
                ("selfie",   selfie,   selfie_name),
                ("video",    video,    video_name),
            ],
        )

    def submit_and_wait(
        self,
        *,
        document:        FileInput,
        selfie:          FileInput,
        video:           FileInput,
        document_type:   str,
        country:         str,
        reference:       str,
        document_name:   str = "document.jpg",
        selfie_name:     str = "selfie.jpg",
        video_name:      str = "liveness.mp4",
        external_user_id: str = "",
        interval:        float = 2.0,
        timeout:         float = 180.0,
        on_status:       Optional[Callable[[VerificationStatus], None]] = None,
    ) -> VerificationResult:
        """Submit and poll until verified/failed/review. Returns the full result."""
        resp     = self.submit(
            document=document, selfie=selfie, video=video,
            document_type=document_type, country=country, reference=reference,
            document_name=document_name, selfie_name=selfie_name, video_name=video_name,
            external_user_id=external_user_id,
        )
        vid      = resp["verification_id"]
        deadline = time.monotonic() + timeout

        while time.monotonic() < deadline:
            time.sleep(interval)
            status_resp = self._http.get(f"/verifications/{vid}/status")
            status: str = status_resp.get("status", "pending")
            if on_status:
                on_status(status)
            if status in _TERMINAL:
                return VerificationResult.from_dict(self._http.get(f"/verifications/{vid}"))

        raise TimeoutError(
            f"Kernaq: verification {vid} did not complete within {timeout}s"
        )

    def get(self, verification_id: str) -> VerificationResult:
        return VerificationResult.from_dict(self._http.get(f"/verifications/{verification_id}"))

    def get_status(self, verification_id: str) -> dict[str, Any]:
        return self._http.get(f"/verifications/{verification_id}/status")

    def get_report(self, verification_id: str) -> dict[str, Any]:
        return self._http.get(f"/verifications/{verification_id}/report")

    def list(self, *, limit: int = 0, before: str = "") -> dict[str, Any]:
        params = ""
        if limit:
            params += f"limit={limit}&"
        if before:
            params += f"before={before}&"
        path = "/verifications" + (f"?{params[:-1]}" if params else "")
        return self._http.get(path)


class DocumentsResource:
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
        fields: dict[str, str] = {}
        if document_type:
            fields["document_type"] = document_type
        if country:
            fields["country"] = country
        data = self._http.upload("/documents/extract", fields, [("document", document, document_name)])
        return ExtractDocumentResult.from_dict(data)

    def validate(
        self,
        *,
        document:      FileInput,
        document_name: str = "document.jpg",
        document_type: str = "",
        country:       str = "",
    ) -> ValidateDocumentResult:
        fields: dict[str, str] = {}
        if document_type:
            fields["document_type"] = document_type
        if country:
            fields["country"] = country
        data = self._http.upload("/documents/validate", fields, [("document", document, document_name)])
        return ValidateDocumentResult.from_dict(data)


class FaceResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def detect(self, *, image: FileInput, image_name: str = "image.jpg") -> FaceDetectResult:
        data = self._http.upload("/face/detect", {}, [("image", image, image_name)])
        return FaceDetectResult.from_dict(data)

    def match(
        self,
        *,
        image_a:      FileInput,
        image_b:      FileInput,
        image_a_name: str = "image_a.jpg",
        image_b_name: str = "image_b.jpg",
    ) -> FaceMatchResult:
        data = self._http.upload(
            "/face/match", {},
            [("image_a", image_a, image_a_name), ("image_b", image_b, image_b_name)],
        )
        return FaceMatchResult.from_dict(data)


class LivenessResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def check(self, *, video: FileInput, video_name: str = "liveness.mp4") -> LivenessResult:
        data = self._http.upload("/liveness/check", {}, [("video", video, video_name)])
        return LivenessResult.from_dict(data)


# ── Main client ───────────────────────────────────────────────────────────────

class Kernaq:
    """
    Kernaq Identity API client.

    Usage::

        from kernaq import Kernaq

        client = Kernaq()                       # env vars
        client = Kernaq(api_key="k_test_...")   # explicit

        result = client.verifications.submit_and_wait(
            document=open("id.jpg", "rb"),
            selfie=open("selfie.jpg", "rb"),
            video=open("liveness.mp4", "rb"),
            document_type="passport",
            country="KEN",
            reference="user_123",
        )
    """

    def __init__(
        self,
        api_key:  Optional[str]   = None,
        base_url: Optional[str]   = None,
        timeout:  float           = 120.0,
    ) -> None:
        http = HttpClient(api_key=api_key, base_url=base_url, timeout=timeout)
        self.verifications = VerificationsResource(http)
        self.documents     = DocumentsResource(http)
        self.face          = FaceResource(http)
        self.liveness      = LivenessResource(http)
