package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Full verification pipeline result from GET /verifications/:id */
@JsonIgnoreProperties(ignoreUnknown = true)
public class VerificationResult {

    @JsonProperty("verification_id") public String       verificationId;
    @JsonProperty("status")          public String       status;
    @JsonProperty("confidence")      public double       confidence;
    @JsonProperty("document")        public DocumentResult  document;
    @JsonProperty("face")            public FaceResult      face;
    @JsonProperty("liveness")        public LivenessResult  liveness;
    @JsonProperty("risk")            public RiskResult      risk;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DocumentResult {
        @JsonProperty("valid")          public boolean        valid;
        @JsonProperty("type")           public String         type;
        @JsonProperty("extracted_data") public ExtractedFields extractedData;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExtractedFields {
        @JsonProperty("first_name")       public String firstName;
        @JsonProperty("last_name")        public String lastName;
        @JsonProperty("document_number")  public String documentNumber;
        @JsonProperty("date_of_birth")    public String dateOfBirth;
        @JsonProperty("expiry_date")      public String expiryDate;
        @JsonProperty("country")          public String country;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FaceResult {
        @JsonProperty("matched")    public boolean matched;
        @JsonProperty("confidence") public double  confidence;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LivenessResult {
        @JsonProperty("passed") public boolean passed;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RiskResult {
        @JsonProperty("level") public String level;
    }
}
