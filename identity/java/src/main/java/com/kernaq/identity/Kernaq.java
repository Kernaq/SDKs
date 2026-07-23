package com.kernaq.identity;

import io.github.cdimascio.dotenv.Dotenv;
import java.time.Duration;

/**
 * Kernaq Identity API client — official Java SDK.
 * Requires Java 17+. Uses java.net.http — no third-party HTTP dependency.
 *
 * <pre>{@code
 * Kernaq kernaq = new Kernaq.Builder().build(); // reads KERNAQ_API_KEY from env
 *
 * VerificationResult result = kernaq.verifications().submitAndWait(
 *     new VerificationsResource.SubmitRequest(
 *         new FileInputStream("id.jpg"),
 *         new FileInputStream("selfie.jpg"),
 *         new FileInputStream("liveness.mp4"),
 *         "passport", "KEN", "user_acct_123"
 *     ), null);
 *
 * System.out.println(result.status);          // "verified"
 * System.out.println(result.failureReason);   // null (or "face_mismatch" etc.)
 * System.out.println(result.face.matched);    // true
 * System.out.println(result.risk.level);      // "low"
 * }</pre>
 */
public class Kernaq {

    private final VerificationsResource verifications;
    private final DocumentsResource     documents;
    private final FaceResource          face;
    private final LivenessResource      liveness;
    private final WebhooksResource      webhooks;
    private final CaptureResource       capture;
    private final SettingsResource      settings;

    private Kernaq(Builder b) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

        String apiKey  = b.apiKey  != null ? b.apiKey  : dotenv.get("KERNAQ_API_KEY",  "");
        String baseUrl = b.baseUrl != null ? b.baseUrl : dotenv.get("KERNAQ_API_URL",  null);

        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalArgumentException(
                "Kernaq: apiKey is required. Pass via Builder.apiKey() or set KERNAQ_API_KEY.");
        }

        var http = new HttpClient(apiKey, baseUrl, b.timeout);
        this.verifications = new VerificationsResource(http);
        this.documents     = new DocumentsResource(http);
        this.face          = new FaceResource(http);
        this.liveness      = new LivenessResource(http);
        this.webhooks      = new WebhooksResource(http);
        this.capture       = new CaptureResource(http);
        this.settings      = new SettingsResource(http);
    }

    /** Full async KYC pipeline — document + selfie + liveness. */
    public VerificationsResource verifications() { return verifications; }
    /** Standalone document OCR and validation. */
    public DocumentsResource     documents()     { return documents; }
    /** Standalone face detection and matching. */
    public FaceResource          face()          { return face; }
    /** Standalone liveness detection. */
    public LivenessResource      liveness()      { return liveness; }
    /** Register and manage webhook endpoints for event callbacks. */
    public WebhooksResource      webhooks()      { return webhooks; }
    /** Issue capture session tokens for the headless capture SDK. */
    public CaptureResource       capture()       { return capture; }
    /** Per-project risk thresholds and security configuration. */
    public SettingsResource      settings()      { return settings; }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static class Builder {
        private String   apiKey;
        private String   baseUrl;
        private Duration timeout = Duration.ofSeconds(120);

        /** Explicit API key. Falls back to KERNAQ_API_KEY env var. */
        public Builder apiKey(String apiKey)   { this.apiKey  = apiKey;  return this; }
        /** Override base URL. Falls back to KERNAQ_API_URL env var. */
        public Builder baseUrl(String baseUrl) { this.baseUrl = baseUrl; return this; }
        /** HTTP timeout. Default: 120s. */
        public Builder timeout(Duration t)     { this.timeout = t;       return this; }

        public Kernaq build() { return new Kernaq(this); }
    }
}
