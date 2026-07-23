package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Returned once on webhook creation. Secret shown only once — store it. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WebhookCreatedResponse {
    @JsonProperty("id")         public String       id;
    @JsonProperty("url")        public String       url;
    @JsonProperty("events")     public List<String> events;
    @JsonProperty("is_active")  public boolean      isActive;
    /** HMAC-SHA256 signing secret. Store securely — never returned again. */
    @JsonProperty("secret")     public String       secret;
    @JsonProperty("created_at") public String       createdAt;
    @JsonProperty("message")    public String       message;
}
