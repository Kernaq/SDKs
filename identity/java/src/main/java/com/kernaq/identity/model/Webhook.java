package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** A registered webhook endpoint. Secret is never returned after creation. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Webhook {
    @JsonProperty("id")         public String       id;
    @JsonProperty("url")        public String       url;
    @JsonProperty("events")     public List<String> events;
    @JsonProperty("is_active")  public boolean      isActive;
    @JsonProperty("created_at") public String       createdAt;
}
