"""Low-level HTTP transport — not part of the public API."""
from __future__ import annotations

import os
import mimetypes
from typing import Any, BinaryIO, Optional, Union

import httpx

from .exceptions import KernaqError

DEFAULT_BASE_URL = "https://api.kernaq.com/v1"
DEFAULT_TIMEOUT  = 120.0  # seconds

FileInput = Union[BinaryIO, bytes]


def _mime(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


class HttpClient:
    def __init__(
        self,
        api_key:  Optional[str] = None,
        base_url: Optional[str] = None,
        timeout:  float = DEFAULT_TIMEOUT,
    ) -> None:
        self._api_key  = api_key  or os.environ.get("KERNAQ_API_KEY", "")
        self._base_url = (base_url or os.environ.get("KERNAQ_API_URL") or DEFAULT_BASE_URL).rstrip("/")
        self._timeout  = timeout

        if not self._api_key:
            raise ValueError(
                "Kernaq: api_key is required. Pass it explicitly or set KERNAQ_API_KEY."
            )

    # ── Internal ──────────────────────────────────────────────────────────────

    def _headers(self) -> dict[str, str]:
        return {"X-API-Key": self._api_key, "Accept": "application/json"}

    def _raise_for_status(self, resp: httpx.Response) -> None:
        if resp.is_error:
            try:
                body    = resp.json()
                code    = body.get("code", "UNKNOWN_ERROR")
                message = body.get("message", resp.text)
            except Exception:
                code, message = "UNKNOWN_ERROR", resp.text
            raise KernaqError(code=code, message=message, status_code=resp.status_code)

    # ── GET ───────────────────────────────────────────────────────────────────

    def get(self, path: str) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as http:
            resp = http.get(f"{self._base_url}{path}", headers=self._headers())
        self._raise_for_status(resp)
        return resp.json()

    # ── JSON mutations ────────────────────────────────────────────────────────

    def post(self, path: str, body: Any) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as http:
            resp = http.post(
                f"{self._base_url}{path}",
                headers={**self._headers(), "Content-Type": "application/json"},
                json=body,
            )
        self._raise_for_status(resp)
        return resp.json()

    def put(self, path: str, body: Any) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as http:
            resp = http.put(
                f"{self._base_url}{path}",
                headers={**self._headers(), "Content-Type": "application/json"},
                json=body,
            )
        self._raise_for_status(resp)
        return resp.json()

    def patch(self, path: str, body: Any) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as http:
            resp = http.patch(
                f"{self._base_url}{path}",
                headers={**self._headers(), "Content-Type": "application/json"},
                json=body,
            )
        self._raise_for_status(resp)
        return resp.json()

    def delete(self, path: str) -> dict[str, Any]:
        with httpx.Client(timeout=self._timeout) as http:
            resp = http.delete(f"{self._base_url}{path}", headers=self._headers())
        self._raise_for_status(resp)
        # DELETE may return 200 with body or 204 with none
        try:
            return resp.json()
        except Exception:
            return {}

    # ── Multipart POST ────────────────────────────────────────────────────────

    def upload(
        self,
        path:          str,
        fields:        dict[str, str],
        files:         list[tuple[str, FileInput, str]],  # (field, data, filename)
        extra_headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        file_parts: list[tuple[str, tuple[str, Any, str]]] = []
        for field, data, filename in files:
            file_parts.append((field, (filename, data, _mime(filename))))

        headers = self._headers()
        if extra_headers:
            headers.update(extra_headers)

        with httpx.Client(timeout=self._timeout) as http:
            resp = http.post(
                f"{self._base_url}{path}",
                headers=headers,
                data=fields,
                files=file_parts,
            )
        self._raise_for_status(resp)
        return resp.json()
