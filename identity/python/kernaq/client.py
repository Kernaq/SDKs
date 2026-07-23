"""Public Kernaq client — the only import most users need."""
from __future__ import annotations

import time
from typing import Any, BinaryIO, Callable, Optional, Union

from ._http import HttpClient, FileInput
from .exceptions import KernaqError
from .types import (
    VerificationResult,
    VerificationStatus,
    VerificationSummary,
    ListVerificationsResult,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    ExtractDocumentResult,
    ValidateDocumentResult,
    Webhook,
    WebhookCreatedResponse,
    WebhookDelivery,
    CaptureSessionResult,
    ProjectSettings,
)

_TERMINAL = {"verified", "failed", "review"}


# ── Resource classes ──────────────────────────────────────────────────────────

class VerificationsResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def submit(
        self,
        *,
        document:           FileInput,
        selfie:             FileInput,
        document_type:      str,
        country:            str,
        reference:          str,
        document_name:      str = "document.jpg",
        selfie_name:        str = "selfie.jpg",
        # ── Liveness — supply video OR all three frames ───────────────────────
        video:              Optional[FileInput] = None,
        video_name:         str = "liveness.mp4",
        frame_1:            Optional[FileInput] = None,
        frame_1_name:       str = "frame_1.jpg",
        frame_2:            Optional[FileInput] = None,
        frame_2_name:       str = "frame_2.jpg",
        frame_3:            Optional[FileInput] = None,
        frame_3_name:       str = "frame_3.jpg",
        external_user_id:   str = "",
        # ── DPA 2019 consent metadata ─────────────────────────────────────────
        consent_reference:  str = "",
        consent_at:         str = "",  # ISO 8601 datetime
        consent_type:       str = "",
        # ── Capture session headers ───────────────────────────────────────────
        capture_token:      str = "",
        capture_nonce:      str = "",
    ) -> dict[str, Any]:
        """Submit a verification and return the 202 response immediately."""
        fields: dict[str, str] = {
            "document_type": document_type,
            "country":       country,
            "reference":     reference,
        }
        if external_user_id:  fields["external_user_id"]  = external_user_id
        if consent_reference: fields["consent_reference"] = consent_reference
        if consent_at:        fields["consent_at"]        = consent_at
        if consent_type:      fields["consent_type"]      = consent_type

        files = [
            ("document", document, document_name),
            ("selfie",   selfie,   selfie_name),
        ]
        if video is not None:
            files.append(("video", video, video_name))
        elif frame_1 is not None and frame_2 is not None and frame_3 is not None:
            files += [
                ("frame_1", frame_1, frame_1_name),
                ("frame_2", frame_2, frame_2_name),
                ("frame_3", frame_3, frame_3_name),
            ]

        extra_headers: dict[str, str] = {}
        if capture_token: extra_headers["X-Capture-Token"] = capture_token
        if capture_nonce: extra_headers["X-Capture-Nonce"] = capture_nonce

        return self._http.upload("/verifications", fields, files, extra_headers=extra_headers)

    def submit_and_wait(
        self,
        *,
        document:           FileInput,
        selfie:             FileInput,
        document_type:      str,
        country:            str,
        reference:          str,
        document_name:      str = "document.jpg",
        selfie_name:        str = "selfie.jpg",
        video:              Optional[FileInput] = None,
        video_name:         str = "liveness.mp4",
        frame_1:            Optional[FileInput] = None,
        frame_1_name:       str = "frame_1.jpg",
        frame_2:            Optional[FileInput] = None,
        frame_2_name:       str = "frame_2.jpg",
        frame_3:            Optional[FileInput] = None,
        frame_3_name:       str = "frame_3.jpg",
        external_user_id:   str = "",
        consent_reference:  str = "",
        consent_at:         str = "",
        consent_type:       str = "",
        capture_token:      str = "",
        capture_nonce:      str = "",
        interval:           float = 2.0,
        timeout:            float = 180.0,
        on_status:          Optional[Callable[[VerificationStatus], None]] = None,
    ) -> VerificationResult:
        """Submit and poll until verified/failed/review. Returns the full result."""
        resp = self.submit(
            document=document, selfie=selfie,
            document_type=document_type, country=country, reference=reference,
            document_name=document_name, selfie_name=selfie_name,
            video=video, video_name=video_name,
            frame_1=frame_1, frame_1_name=frame_1_name,
            frame_2=frame_2, frame_2_name=frame_2_name,
            frame_3=frame_3, frame_3_name=frame_3_name,
            external_user_id=external_user_id,
            consent_reference=consent_reference, consent_at=consent_at, consent_type=consent_type,
            capture_token=capture_token, capture_nonce=capture_nonce,
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

        raise TimeoutError(f"Kernaq: verification {vid} did not complete within {timeout}s")

    def get(self, verification_id: str) -> VerificationResult:
        """Get the full result, including failure_reason when failed."""
        return VerificationResult.from_dict(self._http.get(f"/verifications/{verification_id}"))

    def get_status(self, verification_id: str) -> dict[str, Any]:
        """Lightweight status poll — includes failure_reason on failed verifications."""
        return self._http.get(f"/verifications/{verification_id}/status")

    def get_report(self, verification_id: str) -> dict[str, Any]:
        return self._http.get(f"/verifications/{verification_id}/report")

    def list(
        self,
        *,
        limit:  int = 0,
        before: str = "",
        status: str = "",  # filter by status; empty means all
    ) -> ListVerificationsResult:
        """List verifications for the project with optional status filter."""
        params = ""
        if limit:  params += f"limit={limit}&"
        if before: params += f"before={before}&"
        if status: params += f"status={status}&"
        path = "/verifications" + (f"?{params[:-1]}" if params else "")
        return ListVerificationsResult.from_dict(self._http.get(path))


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
        if document_type: fields["document_type"] = document_type
        if country:       fields["country"]       = country
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
        if document_type: fields["document_type"] = document_type
        if country:       fields["country"]       = country
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


class WebhooksResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def create(self, *, url: str, events: list[str]) -> WebhookCreatedResponse:
        """Register a webhook. The secret in the response is shown only once."""
        data = self._http.post("/webhooks", {"url": url, "events": events})
        return WebhookCreatedResponse.from_dict(data)

    def list(self) -> list[Webhook]:
        data = self._http.get("/webhooks")
        return [Webhook.from_dict(w) for w in data.get("webhooks", [])]

    def get(self, webhook_id: str) -> Webhook:
        return Webhook.from_dict(self._http.get(f"/webhooks/{webhook_id}"))

    def update(self, webhook_id: str, **kwargs: Any) -> Webhook:
        """Update url, events, or is_active. Pass only fields to change."""
        return Webhook.from_dict(self._http.patch(f"/webhooks/{webhook_id}", kwargs))

    def delete(self, webhook_id: str) -> dict[str, Any]:
        return self._http.delete(f"/webhooks/{webhook_id}")

    def rotate_secret(self, webhook_id: str) -> dict[str, Any]:
        """Rotate the signing secret. New secret is active immediately."""
        return self._http.post(f"/webhooks/{webhook_id}/rotate-secret", {})

    def list_deliveries(self, webhook_id: str) -> list[WebhookDelivery]:
        data = self._http.get(f"/webhooks/{webhook_id}/deliveries")
        return [WebhookDelivery.from_dict(d) for d in data.get("deliveries", [])]


class CaptureResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def create_session(self, *, reference: str, device_info: str = "") -> CaptureSessionResult:
        """
        Issue a short-lived capture session token (15 min, single-use).

        Call from your backend, then pass token + nonce to your frontend.
        The frontend attaches both as X-Capture-Token and X-Capture-Nonce
        headers when submitting a verification.
        """
        body: dict[str, str] = {"reference": reference}
        if device_info:
            body["device_info"] = device_info
        return CaptureSessionResult.from_dict(self._http.post("/capture/sessions", body))


class SettingsResource:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def get(self) -> ProjectSettings:
        """Get the current risk thresholds and security settings."""
        return ProjectSettings.from_dict(self._http.get("/settings"))

    def update(self, **kwargs: Any) -> ProjectSettings:
        """
        Update project settings. Pass only the fields to change.

        Example::

            client.settings.update(
                require_capture_token=True,
                enable_cross_project_dedup=True,
                risk_threshold_medium=15,
                risk_threshold_high=40,
            )
        """
        return ProjectSettings.from_dict(self._http.put("/settings", kwargs))


# ── Main client ───────────────────────────────────────────────────────────────

class Kernaq:
    """
    Kernaq Identity API client.

    Usage::

        from kernaq import Kernaq

        client = Kernaq()                       # reads KERNAQ_API_KEY from env
        client = Kernaq(api_key="k_test_...")   # explicit

        result = client.verifications.submit_and_wait(
            document=open("id.jpg", "rb"),
            selfie=open("selfie.jpg", "rb"),
            video=open("liveness.mp4", "rb"),
            document_type="passport",
            country="KEN",
            reference="user_123",
        )
        print(result.status)                # "verified"
        print(result.face.matched)          # True
        print(result.risk.level)            # "low"
    """

    def __init__(
        self,
        api_key:  Optional[str] = None,
        base_url: Optional[str] = None,
        timeout:  float         = 120.0,
    ) -> None:
        http = HttpClient(api_key=api_key, base_url=base_url, timeout=timeout)
        self.verifications = VerificationsResource(http)
        self.documents     = DocumentsResource(http)
        self.face          = FaceResource(http)
        self.liveness      = LivenessResource(http)
        self.webhooks      = WebhooksResource(http)
        self.capture       = CaptureResource(http)
        self.settings      = SettingsResource(http)
