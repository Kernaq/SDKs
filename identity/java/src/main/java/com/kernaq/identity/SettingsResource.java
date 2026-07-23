package com.kernaq.identity;

import com.kernaq.identity.model.ProjectSettings;

import java.io.IOException;
import java.util.Map;

/** Handles /v1/settings. */
public class SettingsResource {

    private final HttpClient http;
    SettingsResource(HttpClient http) { this.http = http; }

    /** Get the current risk thresholds and security settings for the project. */
    public ProjectSettings get() throws IOException {
        return http.get("/settings", ProjectSettings.class);
    }

    /**
     * Update project settings. Pass only the fields to change.
     *
     * <pre>{@code
     * kernaq.settings().update(Map.of(
     *     "require_capture_token",      true,
     *     "enable_cross_project_dedup", true,
     *     "risk_threshold_medium",      15.0,
     *     "risk_threshold_high",        40.0
     * ));
     * }</pre>
     */
    public ProjectSettings update(Map<String, Object> changes) throws IOException {
        return http.putJson("/settings", changes, ProjectSettings.class);
    }
}
