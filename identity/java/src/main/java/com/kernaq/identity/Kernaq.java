package com.kernaq.identity;

import io.github.cdimascio.dotenv.Dotenv;
import java.time.Duration;

/**
 * Kernaq Identity API client — official Java SDK.
 *
 * <p>Reads {@code KERNAQ_API_KEY} and {@code KERNAQ_API_URL} from the environment
 * or a {@code .env} file automatically.
 *
 * <pre>{@code
 * // From environment / .env
 * Kernaq kernaq = new Kernaq.Builder().build();
 *
 * // Explicit key
 * Kernaq kernaq = new Kernaq.Builder()
 *     .apiKey("k_test_...")
 *     .build();
 *
 * // Full KYC pipeline — submits and polls automatically
 * VerificationResult result = kernaq.verifications().submitAndWait(
 *     new VerificationsResource.SubmitRequest(
 *         new FileInputStream("id.jpg"),
 *         new FileInputStream("selfie.jpg"),
 *         new FileInputStream("liveness.mp4"),
 *         "passport", "KEN", "user_acct_123"
 *     ), null);
 *
 * System.out.println(result.status);             // "verified"
 * System.out.println(result.face.matched);       // true
 * System.out.println(result.risk.level);         // "low"
 * }</pre>
 */
public class Kernaq {

    private final VerificationsResource verifications;
    private final DocumentsResource     documents;
    private final FaceResource          face;
    private final LivenessResource      liveness;

    private Kernaq(Builder b) {
        // Load .env if present, ignore if absent
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

        String apiKey  = b.apiKey  != null ? b.apiKey  : dotenv.get("KERNAQ_API_KEY",  "");
        String baseUrl = b.baseUrl != null ? b.baseUrl : dotenv.get("KERNAQ_API_URL",  null);

        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalArgumentException(
                "Kernaq: apiKey is required. Pass it via Builder.apiKey() or set KERNAQ_API_KEY.");
        }

        var http = new HttpClient(apiKey, baseUrl, b.timeout);
        this.verifications = new VerificationsResource(http);
        this.documents     = new DocumentsResource(http);
        this.face          = new FaceResource(http);
        this.liveness      = new LivenessResource(http);
    }

    public VerificationsResource verifications() { return verifications; }
    public DocumentsResource     documents()     { return documents; }
    public FaceResource          face()          { return face; }
    public LivenessResource      liveness()      { return liveness; }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static class Builder {
        private String   apiKey;
        private String   baseUrl;
        private Duration timeout = Duration.ofSeconds(120);

        /** Set the API key explicitly. Falls back to KERNAQ_API_KEY env var. */
        public Builder apiKey(String apiKey)   { this.apiKey  = apiKey;  return this; }

        /** Override the base URL. Falls back to KERNAQ_API_URL env var. */
        public Builder baseUrl(String baseUrl) { this.baseUrl = baseUrl; return this; }

        /** Set the HTTP timeout. Default: 120s. */
        public Builder timeout(Duration t)     { this.timeout = t;       return this; }

        public Kernaq build() { return new Kernaq(this); }
    }
}
