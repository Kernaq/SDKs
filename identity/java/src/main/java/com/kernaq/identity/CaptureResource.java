package com.kernaq.identity;

import com.kernaq.identity.model.CaptureSessionResponse;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Handles /v1/capture/sessions. */
public class CaptureResource {

    private final HttpClient http;
    CaptureResource(HttpClient http) { this.http = http; }

    /**
     * Issue a short-lived capture session token (15 min, single-use).
     *
     * <p>Call this from your backend, then pass token + nonce to your frontend.
     * The frontend attaches both as {@code X-Capture-Token} and
     * {@code X-Capture-Nonce} headers when submitting a verification.
     *
     * @param reference  ties the session to a user/flow (same as verification reference)
     * @param deviceInfo optional SDK version + platform string for audit logging
     */
    public CaptureSessionResponse createSession(String reference,
                                                String deviceInfo) throws IOException {
        var body = new LinkedHashMap<String, String>();
        body.put("reference", reference);
        if (deviceInfo != null && !deviceInfo.isEmpty()) body.put("device_info", deviceInfo);
        return http.postJson("/capture/sessions", body, CaptureSessionResponse.class);
    }
}
