package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Response from POST /face/match */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FaceMatchResult {
    @JsonProperty("matched")      public boolean matched;
    @JsonProperty("confidence")   public double  confidence;
    @JsonProperty("processed_at") public String  processedAt;
}
