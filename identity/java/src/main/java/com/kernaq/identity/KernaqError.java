package com.kernaq.identity;

/**
 * Thrown when the Kernaq API returns a non-2xx response.
 */
public class KernaqError extends RuntimeException {

    private final String code;
    private final int    statusCode;

    public KernaqError(String code, String message, int statusCode) {
        super(message);
        this.code       = code;
        this.statusCode = statusCode;
    }

    /** The Kernaq error code, e.g. {@code "UNAUTHORIZED"}, {@code "NOT_FOUND"}. */
    public String getCode()       { return code; }

    /** The HTTP status code, e.g. {@code 401}, {@code 404}. */
    public int    getStatusCode() { return statusCode; }

    @Override
    public String toString() {
        return "KernaqError[code=" + code + ", status=" + statusCode + ", message=" + getMessage() + "]";
    }
}
