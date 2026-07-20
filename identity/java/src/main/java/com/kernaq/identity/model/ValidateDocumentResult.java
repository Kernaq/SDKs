package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Response from POST /documents/validate */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ValidateDocumentResult {
    @JsonProperty("valid")          public boolean     valid;
    @JsonProperty("document_type")  public String      documentType;
    @JsonProperty("flags")          public List<String> flags;
    @JsonProperty("processed_at")   public String      processedAt;
}
