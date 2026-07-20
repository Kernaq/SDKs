package com.kernaq.identity.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Response from POST /documents/extract */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExtractDocumentResult {
    @JsonProperty("document_type") public String documentType;
    @JsonProperty("fields")        public Fields  fields;
    @JsonProperty("raw_lines")     public List<String> rawLines;
    @JsonProperty("processed_at")  public String  processedAt;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Fields {
        @JsonProperty("first_name")       public String firstName;
        @JsonProperty("last_name")        public String lastName;
        @JsonProperty("document_number")  public String documentNumber;
        @JsonProperty("date_of_birth")    public String dateOfBirth;
        @JsonProperty("expiry_date")      public String expiryDate;
        @JsonProperty("country")          public String country;
    }
}
