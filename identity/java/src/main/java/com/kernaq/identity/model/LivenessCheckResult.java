package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Response from POST /liveness/check */
@JsonIgnoreProperties(ignoreUnknown = true)
public class LivenessCheckResult {

    @JsonProperty("passed")      public boolean       passed;
    @JsonProperty("confidence")  public double        confidence;
    @JsonProperty("details")     public Details       details;
    @JsonProperty("processed_at") public String       processedAt;

    /** Movement analysis from the liveness check. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Details {
        @JsonProperty("mode")              public String  mode; // "video" | "frame_sequence"
        @JsonProperty("detected_frames")   public int     detectedFrames;
        @JsonProperty("extracted_frames")  public int     extractedFrames;
        @JsonProperty("delta_yaw")         public double  deltaYaw;
        @JsonProperty("delta_pitch")       public double  deltaPitch;
        @JsonProperty("delta_roll")        public double  deltaRoll;
        @JsonProperty("movement_detected") public boolean movementDetected;
    }
}
