package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** A single webhook delivery attempt row. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WebhookDelivery {
    @JsonProperty("id")           public String id;
    @JsonProperty("event_type")   public String eventType;
    @JsonProperty("event_id")     public String eventId;
    /** "pending" | "delivered" | "failed" | "abandoned" */
    @JsonProperty("status")       public String status;
    @JsonProperty("attempts")     public int    attempts;
    @JsonProperty("max_attempts") public int    maxAttempts;
    @JsonProperty("next_attempt") public String nextAttempt;
    @JsonProperty("last_error")   public String lastError;
    @JsonProperty("delivered_at") public String deliveredAt;
    @JsonProperty("created_at")   public String createdAt;
}
