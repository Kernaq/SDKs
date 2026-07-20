package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

/** Response from POST /face/detect */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FaceDetectResult {
    @JsonProperty("detected")        public boolean            detected;
    @JsonProperty("confidence")      public double             confidence;
    @JsonProperty("bounding_box")    public BoundingBox        boundingBox;
    @JsonProperty("age_range_low")   public int                ageRangeLow;
    @JsonProperty("age_range_high")  public int                ageRangeHigh;
    @JsonProperty("gender")          public String             gender;
    @JsonProperty("attributes")      public Map<String,Object> attributes;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BoundingBox {
        @JsonProperty("left")   public double left;
        @JsonProperty("top")    public double top;
        @JsonProperty("width")  public double width;
        @JsonProperty("height") public double height;
    }
}
