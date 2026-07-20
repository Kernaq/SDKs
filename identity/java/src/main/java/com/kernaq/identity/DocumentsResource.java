package com.kernaq.identity;

import com.kernaq.identity.HttpClient.FilePart;
import com.kernaq.identity.model.ExtractDocumentResult;
import com.kernaq.identity.model.ValidateDocumentResult;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/** Handles /v1/documents. */
public class DocumentsResource {

    private final HttpClient http;
    DocumentsResource(HttpClient http) { this.http = http; }

    /** Extract structured fields from a document image (synchronous). */
    public ExtractDocumentResult extract(InputStream document, String documentName,
                                         String documentType, String country) throws IOException {
        var fields = optionalFields(documentType, country);
        var name   = nameOr(documentName, "document.jpg");
        return http.upload("/documents/extract", fields,
                List.of(new FilePart("document", document, name)),
                ExtractDocumentResult.class);
    }

    /** Validate a document and return validity flags (synchronous). */
    public ValidateDocumentResult validate(InputStream document, String documentName,
                                            String documentType, String country) throws IOException {
        var fields = optionalFields(documentType, country);
        var name   = nameOr(documentName, "document.jpg");
        return http.upload("/documents/validate", fields,
                List.of(new FilePart("document", document, name)),
                ValidateDocumentResult.class);
    }

    private static Map<String, String> optionalFields(String type, String country) {
        var m = new java.util.LinkedHashMap<String, String>();
        if (type    != null && !type.isEmpty())    m.put("document_type", type);
        if (country != null && !country.isEmpty()) m.put("country", country);
        return m;
    }

    private static String nameOr(String s, String fallback) {
        return (s != null && !s.isEmpty()) ? s : fallback;
    }
}
