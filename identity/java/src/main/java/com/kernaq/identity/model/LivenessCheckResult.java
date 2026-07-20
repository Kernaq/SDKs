package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Response from POST /liveness/check */
@JsonIgnoreProperties(ignoreUnknown = true)
public class LivenessCheckResult {
    @JsonProperty("passed")     public boolean passed;
    @JsonProperty("confidence") public double  confidence;
    @JsonProperty("reason")     public String  reason;
}
