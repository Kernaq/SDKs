package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Response from POST /capture/sessions. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CaptureSessionResponse {
    @JsonProperty("session_id")  public String sessionId;
    /** 64-char hex token. Pass to capture SDK as X-Capture-Token. Never log it. */
    @JsonProperty("token")       public String token;
    /** 32-char hex nonce. Pass as X-Capture-Nonce. Single-use. */
    @JsonProperty("nonce")       public String nonce;
    @JsonProperty("expires_at")  public String expiresAt;
    @JsonProperty("ttl_seconds") public int    ttlSeconds;
    @JsonProperty("message")     public String message;
}
