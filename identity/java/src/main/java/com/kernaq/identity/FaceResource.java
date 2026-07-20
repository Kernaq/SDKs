package com.kernaq.identity;

import com.kernaq.identity.HttpClient.FilePart;
import com.kernaq.identity.model.FaceDetectResult;
import com.kernaq.identity.model.FaceMatchResult;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/** Handles /v1/face. */
public class FaceResource {

    private final HttpClient http;
    FaceResource(HttpClient http) { this.http = http; }

    /** Detect a face and return bounding box + attributes (synchronous). */
    public FaceDetectResult detect(InputStream image, String imageName) throws IOException {
        var name = nameOr(imageName, "image.jpg");
        return http.upload("/face/detect", Map.of(),
                List.of(new FilePart("image", image, name)),
                FaceDetectResult.class);
    }

    /** Compare two face images and return a similarity score (synchronous). */
    public FaceMatchResult match(InputStream imageA, String imageAName,
                                  InputStream imageB, String imageBName) throws IOException {
        return http.upload("/face/match", Map.of(),
                List.of(
                    new FilePart("image_a", imageA, nameOr(imageAName, "image_a.jpg")),
                    new FilePart("image_b", imageB, nameOr(imageBName, "image_b.jpg"))
                ),
                FaceMatchResult.class);
    }

    private static String nameOr(String s, String fallback) {
        return (s != null && !s.isEmpty()) ? s : fallback;
    }
}
