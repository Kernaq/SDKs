package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Per-project risk thresholds and security configuration. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectSettings {
    @JsonProperty("project_id")                   public String  projectId;
    @JsonProperty("risk_threshold_medium")         public double  riskThresholdMedium;
    @JsonProperty("risk_threshold_high")           public double  riskThresholdHigh;
    @JsonProperty("max_attempts_per_reference")    public int     maxAttemptsPerReference;
    /** When true, every verification must include X-Capture-Token + X-Capture-Nonce. */
    @JsonProperty("require_capture_token")         public boolean requireCaptureToken;
    /** When true, face/doc hashes are checked across all projects on the platform. */
    @JsonProperty("enable_cross_project_dedup")    public boolean enableCrossProjectDedup;
    @JsonProperty("created_at")                    public String  createdAt;
    @JsonProperty("updated_at")                    public String  updatedAt;
}
