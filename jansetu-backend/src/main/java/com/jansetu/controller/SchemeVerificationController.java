package com.jansetu.controller;

import com.jansetu.model.SchemeVerification;
import com.jansetu.service.SchemeVerificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Producer-Consumer Scheme Verifications (Admin Pipeline)
 */
@RestController
@RequestMapping("/api/verifications")
public class SchemeVerificationController {

    private final SchemeVerificationService verificationService;

    public SchemeVerificationController(SchemeVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping
    public ResponseEntity<SchemeVerification> createVerification(@RequestBody Map<String, Object> payload) {
        Integer schemeId = payload.get("schemeId") != null ? Integer.valueOf(payload.get("schemeId").toString()) : null;
        Integer priority = payload.get("priority") != null ? Integer.valueOf(payload.get("priority").toString()) : 1;
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : "Admin scheme verification request";

        if (schemeId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Producer: Enqueues into SchemeReviewQueue and saves to MySQL
        SchemeVerification verification = verificationService.submitForVerification(schemeId, priority, notes);
        return ResponseEntity.status(HttpStatus.CREATED).body(verification);
    }

    @GetMapping
    public ResponseEntity<List<SchemeVerification>> getAllVerifications() {
        return ResponseEntity.ok(verificationService.getAllVerifications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchemeVerification> getVerificationById(@PathVariable Integer id) {
        return verificationService.getVerificationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
