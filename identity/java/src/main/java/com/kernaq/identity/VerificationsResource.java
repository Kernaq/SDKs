package com.kernaq.identity;

import com.kernaq.identity.model.VerificationResult;
import com.kernaq.identity.HttpClient.FilePart;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/** Handles /v1/verifications. */
public class VerificationsResource {

    private static final java.util.Set<String> TERMINAL =
            java.util.Set.of("verified", "failed", "review");

    private final HttpClient http;

    VerificationsResource(HttpClient http) { this.http = http; }

    /**
     * Submit a full KYC verification. Returns immediately (HTTP 202).
     * Use {@link #submitAndWait} to poll automatically.
     */
    public Map<?, ?> submit(SubmitRequest req) throws IOException {
        return http.upload("/verifications",
                buildFields(req),
                List.of(
                    new FilePart("document", req.document, nameOr(req.documentName, "document.jpg")),
                    new FilePart("selfie",   req.selfie,   nameOr(req.selfieName,   "selfie.jpg")),
                    new FilePart("video",    req.video,    nameOr(req.videoName,     "liveness.mp4"))
                ),
                Map.class);
    }

    /**
     * Submit and poll until the pipeline reaches a terminal state.
     *
     * <pre>{@code
     * var result = kernaq.verifications().submitAndWait(
     *     new VerificationsResource.SubmitRequest(
     *         docStream, selfieStream, videoStream,
     *         "passport", "KEN", "user_acct_123"
     *     ), null);
     * System.out.println(result.status); // "verified"
     * }</pre>
     */
    public VerificationResult submitAndWait(SubmitRequest req, PollOptions opts) throws IOException, InterruptedException {
        Duration interval = Duration.ofSeconds(2);
        Duration timeout  = Duration.ofMinutes(3);
        Consumer<String> onStatus = null;

        if (opts != null) {
            if (opts.interval != null) interval = opts.interval;
            if (opts.timeout  != null) timeout  = opts.timeout;
            onStatus = opts.onStatus;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> submitted = (Map<String, Object>) submit(req);
        String id = (String) submitted.get("verification_id");

        long deadline = System.currentTimeMillis() + timeout.toMillis();

        while (System.currentTimeMillis() < deadline) {
            Thread.sleep(interval.toMillis());

            @SuppressWarnings("unchecked")
            Map<String, Object> statusResp = (Map<String, Object>) http.get(
                    "/verifications/" + id + "/status", Map.class);
            String status = (String) statusResp.get("status");
            if (onStatus != null) onStatus.accept(status);

            if (TERMINAL.contains(status)) {
                return http.get("/verifications/" + id, VerificationResult.class);
            }
        }
        throw new RuntimeException("Kernaq: verification " + id + " did not complete within " + timeout);
    }

    /** Get the full verification result. */
    public VerificationResult get(String verificationId) throws IOException {
        return http.get("/verifications/" + verificationId, VerificationResult.class);
    }

    /** Get the lightweight status of a verification. */
    public Map<?, ?> getStatus(String verificationId) throws IOException {
        return http.get("/verifications/" + verificationId + "/status", Map.class);
    }

    /** Get the full verification report once the pipeline has completed. */
    public Map<?, ?> getReport(String verificationId) throws IOException {
        return http.get("/verifications/" + verificationId + "/report", Map.class);
    }

    /** List verifications for the authenticated project. */
    public Map<?, ?> list(int limit, String before) throws IOException {
        var sb = new StringBuilder("/verifications");
        if (limit > 0 || (before != null && !before.isEmpty())) {
            sb.append("?");
            if (limit > 0) sb.append("limit=").append(limit).append("&");
            if (before != null && !before.isEmpty()) sb.append("before=").append(before);
        }
        return http.get(sb.toString().replaceAll("&$", ""), Map.class);
    }

    // ── Request / option types ────────────────────────────────────────────────

    public static class SubmitRequest {
        public final InputStream document;
        public final InputStream selfie;
        public final InputStream video;
        public final String      documentType;
        public final String      country;
        public final String      reference;
        public String documentName;
        public String selfieName;
        public String videoName;
        public String externalUserId;

        public SubmitRequest(InputStream document, InputStream selfie, InputStream video,
                             String documentType, String country, String reference) {
            this.document     = document;
            this.selfie       = selfie;
            this.video        = video;
            this.documentType = documentType;
            this.country      = country;
            this.reference    = reference;
        }
    }

    public static class PollOptions {
        public Duration          interval;
        public Duration          timeout;
        public Consumer<String>  onStatus;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Map<String, String> buildFields(SubmitRequest req) {
        var m = new java.util.LinkedHashMap<String, String>();
        m.put("document_type", req.documentType);
        m.put("country",       req.country);
        m.put("reference",     req.reference);
        if (req.externalUserId != null && !req.externalUserId.isEmpty())
            m.put("external_user_id", req.externalUserId);
        return m;
    }

    private static String nameOr(String s, String fallback) {
        return (s != null && !s.isEmpty()) ? s : fallback;
    }
}
