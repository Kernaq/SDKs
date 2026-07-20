package com.kernaq.identity;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Low-level HTTP transport — not part of the public API.
 * Uses java.net.http (Java 11+), no third-party HTTP dependency needed.
 */
class HttpClient {

    private static final String DEFAULT_BASE_URL = "https://api.kernaq.com/v1";
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(120);

    private final String apiKey;
    private final String baseUrl;
    private final java.net.http.HttpClient http;
    final ObjectMapper mapper = new ObjectMapper();

    HttpClient(String apiKey, String baseUrl, Duration timeout) {
        this.apiKey  = apiKey;
        this.baseUrl = (baseUrl != null ? baseUrl : DEFAULT_BASE_URL).replaceAll("/$", "");
        this.http    = java.net.http.HttpClient.newBuilder()
                .connectTimeout(timeout != null ? timeout : DEFAULT_TIMEOUT)
                .build();
    }

    // ── GET ───────────────────────────────────────────────────────────────────

    <T> T get(String path, Class<T> type) throws IOException {
        var req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("X-API-Key", apiKey)
                .header("Accept", "application/json")
                .GET()
                .build();
        return execute(req, type);
    }

    // ── Multipart POST ────────────────────────────────────────────────────────

    /**
     * FilePart bundles a field name with a readable file source.
     */
    record FilePart(String field, InputStream data, String filename) {}

    <T> T upload(String path, Map<String, String> fields,
                 List<FilePart> files, Class<T> type) throws IOException {
        String boundary = UUID.randomUUID().toString().replace("-", "");
        var body = buildMultipart(boundary, fields, files);

        var req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("X-API-Key", apiKey)
                .header("Accept", "application/json")
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();
        return execute(req, type);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private <T> T execute(HttpRequest req, Class<T> type) throws IOException {
        HttpResponse<String> resp;
        try {
            resp = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Kernaq: request interrupted", e);
        }

        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String code    = "UNKNOWN_ERROR";
            String message = resp.body();
            try {
                var node = mapper.readTree(resp.body());
                if (node.has("code"))    code    = node.get("code").asText();
                if (node.has("message")) message = node.get("message").asText();
            } catch (Exception ignored) {}
            throw new KernaqError(code, message, resp.statusCode());
        }

        return mapper.readValue(resp.body(), type);
    }

    private byte[] buildMultipart(String boundary, Map<String, String> fields,
                                   List<FilePart> files) throws IOException {
        var buf = new ArrayList<byte[]>();
        var CRLF = "\r\n";
        var DASH = "--";

        for (var e : fields.entrySet()) {
            buf.add((DASH + boundary + CRLF +
                    "Content-Disposition: form-data; name=\"" + e.getKey() + "\"" + CRLF +
                    CRLF + e.getValue() + CRLF).getBytes(StandardCharsets.UTF_8));
        }

        for (var f : files) {
            String mime = mimeFromName(f.filename());
            buf.add((DASH + boundary + CRLF +
                    "Content-Disposition: form-data; name=\"" + f.field() + "\"; filename=\"" + f.filename() + "\"" + CRLF +
                    "Content-Type: " + mime + CRLF + CRLF).getBytes(StandardCharsets.UTF_8));
            buf.add(f.data().readAllBytes());
            buf.add(CRLF.getBytes(StandardCharsets.UTF_8));
        }

        buf.add((DASH + boundary + DASH + CRLF).getBytes(StandardCharsets.UTF_8));

        int total = buf.stream().mapToInt(b -> b.length).sum();
        byte[] out = new byte[total];
        int pos = 0;
        for (var b : buf) { System.arraycopy(b, 0, out, pos, b.length); pos += b.length; }
        return out;
    }

    private static String mimeFromName(String name) {
        String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : "";
        return switch (ext) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png"         -> "image/png";
            case "heic"        -> "image/heic";
            case "pdf"         -> "application/pdf";
            case "mp4"         -> "video/mp4";
            case "mov"         -> "video/quicktime";
            case "webm"        -> "video/webm";
            default            -> "application/octet-stream";
        };
    }
}
