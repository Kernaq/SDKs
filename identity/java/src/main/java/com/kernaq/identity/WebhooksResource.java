package com.kernaq.identity;

import com.kernaq.identity.model.Webhook;
import com.kernaq.identity.model.WebhookCreatedResponse;
import com.kernaq.identity.model.WebhookDelivery;
import com.fasterxml.jackson.core.type.TypeReference;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Handles /v1/webhooks. */
public class WebhooksResource {

    private final HttpClient http;
    WebhooksResource(HttpClient http) { this.http = http; }

    /**
     * Register a webhook endpoint to receive signed event callbacks.
     * The secret in the response is shown only once — store it securely.
     *
     * @param url    HTTPS URL that will receive POST requests
     * @param events e.g. List.of("verification.completed", "verification.failed")
     */
    public WebhookCreatedResponse create(String url, List<String> events) throws IOException {
        return http.postJson("/webhooks",
                Map.of("url", url, "events", events),
                WebhookCreatedResponse.class);
    }

    /** List all webhooks for the project. Secrets are never returned. */
    @SuppressWarnings("unchecked")
    public List<Webhook> list() throws IOException {
        var resp = (Map<String, Object>) http.get("/webhooks", Map.class);
        var raw  = (List<?>) resp.get("webhooks");
        return http.mapper.convertValue(raw, new TypeReference<List<Webhook>>() {});
    }

    /** Get a single webhook by ID. */
    public Webhook get(String id) throws IOException {
        return http.get("/webhooks/" + id, Webhook.class);
    }

    /** Update a webhook's URL, events, or active status. Only include fields to change. */
    public Webhook update(String id, Map<String, Object> changes) throws IOException {
        return http.patchJson("/webhooks/" + id, changes, Webhook.class);
    }

    /** Delete a webhook. */
    public void delete(String id) throws IOException {
        http.delete("/webhooks/" + id);
    }

    /**
     * Rotate the signing secret. The new secret is active immediately.
     * Store the returned secret before this call returns.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> rotateSecret(String id) throws IOException {
        return (Map<String, Object>) http.postJson("/webhooks/" + id + "/rotate-secret",
                Map.of(), Map.class);
    }

    /** List the last 50 delivery attempts for a webhook. */
    @SuppressWarnings("unchecked")
    public List<WebhookDelivery> listDeliveries(String id) throws IOException {
        var resp = (Map<String, Object>) http.get("/webhooks/" + id + "/deliveries", Map.class);
        var raw  = (List<?>) resp.get("deliveries");
        return http.mapper.convertValue(raw, new TypeReference<List<WebhookDelivery>>() {});
    }
}
