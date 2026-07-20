package com.kernaq.identity;

import com.kernaq.identity.HttpClient.FilePart;
import com.kernaq.identity.model.LivenessCheckResult;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/** Handles /v1/liveness. */
public class LivenessResource {

    private final HttpClient http;
    LivenessResource(HttpClient http) { this.http = http; }

    /** Check a video for liveness — detects replay attacks and spoof (synchronous). */
    public LivenessCheckResult check(InputStream video, String videoName) throws IOException {
        var name = (videoName != null && !videoName.isEmpty()) ? videoName : "liveness.mp4";
        return http.upload("/liveness/check", Map.of(),
                List.of(new FilePart("video", video, name)),
                LivenessCheckResult.class);
    }
}
