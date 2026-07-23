package com.kernaq.identity;

import com.kernaq.identity.HttpClient.FilePart;
import com.kernaq.identity.model.VerificationResult;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;

/** Handles /v1/verifications. */
public class VerificationsResource {

    private static final Set<String> TERMINAL = Set.of("verified", "failed", "review");

    private final HttpClient http;
    VerificationsResource(HttpClient http) { this.http = http; }

    /**
     * Submit a full KYC verification. Returns immediately (HTTP 202).
     * Supports two liveness modes — supply {@code video} OR all three frames.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> submit(SubmitRequest req) throws IOException {
        var fields = buildFields(req);
        var files  = buildFiles(req);
        var extra  = buildExtraHeaders(req);
        return (Map<String, Object>) http.uploadWithHeaders(
                "/verifications", fields, files, extra, Map.class);
    }

    /**
     * Submit and poll until pipeline reaches terminal state (verified|failed|review).
     *
     * <pre>{@code
     * var result = kernaq.verifications().submitAndWait(
     *     VerificationsResource.SubmitRequest.builder()
     *         .document(docStream).selfie(selfieStream).video(videoStream)
     *         .documentType("passport").country("KEN").reference("user_123")
     *         .build(), null);
     * if ("failed".equals(result.status)) {
     *     System.out.println(result.failureReason); // e.g. "face_mismatch"
     * }
     * }</pre>
     */
    public VerificationResult submitAndWait(SubmitRequest req, PollOptions opts)
            throws IOException, InterruptedException {
        Duration interval = Duration.ofSeconds(2);
        Duration timeout  = Duration.ofMinutes(3);
        Consumer<String> onStatus = null;
        if (opts != null) {
            if (opts.interval != null) interval = opts.interval;
            if (opts.timeout  != null) timeout  = opts.timeout;
            onStatus = opts.onStatus;
        }

        var submitted = submit(req);
        String id = (String) submitted.get("verification_id");
        long deadline = System.currentTimeMillis() + timeout.toMillis();

        while (System.currentTimeMillis() < deadline) {
            Thread.sleep(interval.toMillis());
            @SuppressWarnings("unchecked")
            var statusResp = (Map<String, Object>) http.get(
                    "/verifications/" + id + "/status", Map.class);
            String status = (String) statusResp.get("status");
            if (onStatus != null) onStatus.accept(status);
            if (TERMINAL.contains(status)) {
                return http.get("/verifications/" + id, VerificationResult.class);
            }
        }
        throw new RuntimeException(
                "Kernaq: verification " + id + " did not complete within " + timeout);
    }

    /** Get the full verification result, including failureReason when failed. */
    public VerificationResult get(String id) throws IOException {
        return http.get("/verifications/" + id, VerificationResult.class);
    }

    /** Lightweight status poll — includes failureReason when status is failed. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getStatus(String id) throws IOException {
        return (Map<String, Object>) http.get("/verifications/" + id + "/status", Map.class);
    }

    /** Get the full report once the pipeline has completed. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getReport(String id) throws IOException {
        return (Map<String, Object>) http.get("/verifications/" + id + "/report", Map.class);
    }

    /**
     * List verifications for the authenticated project.
     *
     * @param limit  max rows (1–100); 0 uses server default (20)
     * @param before keyset cursor from a previous nextCursor; null for first page
     * @param status filter by status ("pending","processing","verified","failed","review");
     *               null or empty returns all
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> list(int limit, String before, String status) throws IOException {
        var sb = new StringBuilder("/verifications");
        var sep = new String[]{"?"};
        var add = (java.util.function.BiConsumer<String, String>) (k, v) -> {
            if (v != null && !v.isEmpty()) {
                sb.append(sep[0]).append(k).append("=").append(v);
                sep[0] = "&";
            }
        };
        if (limit > 0) add.accept("limit", String.valueOf(limit));
        add.accept("before", before);
        add.accept("status", status);
        return (Map<String, Object>) http.get(sb.toString(), Map.class);
    }

    // ── Request / options ─────────────────────────────────────────────────────

    /** Request object for submit. Use the builder for readable construction. */
    public static class SubmitRequest {
        // Required
        public final InputStream document;
        public final InputStream selfie;
        public final String      documentType;
        public final String      country;
        public final String      reference;
        // File names
        public String documentName;
        public String selfieName;
        // Liveness — supply video OR all three frames
        public InputStream video;
        public String      videoName;
        public InputStream frame1;
        public String      frame1Name;
        public InputStream frame2;
        public String      frame2Name;
        public InputStream frame3;
        public String      frame3Name;
        // Optional
        public String externalUserId;
        // DPA 2019 consent metadata
        public String consentReference;
        public String consentAt;
        public String consentType;
        // Capture session (required when project.requireCaptureToken == true)
        public String captureToken;
        public String captureNonce;

        /** Minimal constructor — sets video path. */
        public SubmitRequest(InputStream document, InputStream selfie, InputStream video,
                             String documentType, String country, String reference) {
            this.document     = document;
            this.selfie       = selfie;
            this.video        = video;
            this.documentType = documentType;
            this.country      = country;
            this.reference    = reference;
        }

        /** Full constructor for frame-sequence liveness. */
        public SubmitRequest(InputStream document, InputStream selfie,
                             InputStream frame1, InputStream frame2, InputStream frame3,
                             String documentType, String country, String reference) {
            this.document     = document;
            this.selfie       = selfie;
            this.frame1       = frame1;
            this.frame2       = frame2;
            this.frame3       = frame3;
            this.documentType = documentType;
            this.country      = country;
            this.reference    = reference;
        }
    }

    public static class PollOptions {
        public Duration         interval; // default 2s
        public Duration         timeout;  // default 3m
        public Consumer<String> onStatus;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Map<String, String> buildFields(SubmitRequest req) {
        var m = new LinkedHashMap<String, String>();
        m.put("document_type", req.documentType);
        m.put("country",       req.country);
        m.put("reference",     req.reference);
        putIfPresent(m, "external_user_id",  req.externalUserId);
        putIfPresent(m, "consent_reference", req.consentReference);
        putIfPresent(m, "consent_at",        req.consentAt);
        putIfPresent(m, "consent_type",      req.consentType);
        return m;
    }

    private static List<FilePart> buildFiles(SubmitRequest req) {
        var files = new ArrayList<FilePart>();
        files.add(new FilePart("document", req.document, nameOr(req.documentName, "document.jpg")));
        files.add(new FilePart("selfie",   req.selfie,   nameOr(req.selfieName,   "selfie.jpg")));
        if (req.video != null) {
            files.add(new FilePart("video", req.video, nameOr(req.videoName, "liveness.mp4")));
        } else if (req.frame1 != null && req.frame2 != null && req.frame3 != null) {
            files.add(new FilePart("frame_1", req.frame1, nameOr(req.frame1Name, "frame_1.jpg")));
            files.add(new FilePart("frame_2", req.frame2, nameOr(req.frame2Name, "frame_2.jpg")));
            files.add(new FilePart("frame_3", req.frame3, nameOr(req.frame3Name, "frame_3.jpg")));
        }
        return files;
    }

    private static Map<String, String> buildExtraHeaders(SubmitRequest req) {
        var m = new LinkedHashMap<String, String>();
        if (req.captureToken != null && !req.captureToken.isEmpty())
            m.put("X-Capture-Token", req.captureToken);
        if (req.captureNonce != null && !req.captureNonce.isEmpty())
            m.put("X-Capture-Nonce", req.captureNonce);
        return m;
    }

    private static void putIfPresent(Map<String, String> m, String key, String val) {
        if (val != null && !val.isEmpty()) m.put(key, val);
    }

    private static String nameOr(String s, String fallback) {
        return (s != null && !s.isEmpty()) ? s : fallback;
    }
}
