package com.jansetu.service;

import com.jansetu.collections.SchemeManager;
import com.jansetu.concurrency.SchemeReviewQueue;
import com.jansetu.model.Scheme;
import com.jansetu.model.SchemeVerification;
import com.jansetu.model.VerificationTask;
import com.jansetu.repository.VerificationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

/**
 * SchemeVerificationService acts as the PRODUCER in the Producer-Consumer pattern
 * for admin scheme verification requests.
 */
@Service
public class SchemeVerificationService {

    private static final Logger LOGGER = Logger.getLogger(SchemeVerificationService.class.getName());

    private final VerificationRepository verificationRepository;
    private final SchemeReviewQueue schemeReviewQueue;
    private final SchemeManager schemeManager;
    private final Map<Integer, SchemeVerification> memoryVerifications = new ConcurrentHashMap<>();
    private final AtomicInteger taskIdCounter = new AtomicInteger(1);

    public SchemeVerificationService(VerificationRepository verificationRepository,
                                     SchemeReviewQueue schemeReviewQueue,
                                     SchemeManager schemeManager) {
        this.verificationRepository = verificationRepository;
        this.schemeReviewQueue = schemeReviewQueue;
        this.schemeManager = schemeManager;
    }

    /**
     * Producer method: Creates verification in MySQL via JDBC and pushes task to SchemeReviewQueue.
     */
    public SchemeVerification submitForVerification(Integer schemeId, Integer priority, String notes) {
        if (schemeId == null) {
            throw new IllegalArgumentException("schemeId is required for verification");
        }

        int prio = priority != null ? priority : 1;
        SchemeVerification verif = new SchemeVerification(schemeId, prio, notes);

        try {
            // JDBC: Save initial record with PENDING status
            verif = verificationRepository.save(verif);
        } catch (Exception e) {
            LOGGER.warning("Could not persist scheme verification to MySQL: " + e.getMessage() + ". Using memory fallback.");
            verif.setId(taskIdCounter.getAndIncrement());
        }

        // Set scheme name if available
        Scheme s = schemeManager.getById(String.valueOf(schemeId));
        if (s != null) {
            verif.setSchemeName(s.getName());
        }

        memoryVerifications.put(verif.getId(), verif);

        // Collections: Create VerificationTask (implements Comparable)
        VerificationTask task = new VerificationTask(verif.getId(), schemeId, prio,
                notes != null ? notes : "Admin verification for scheme #" + schemeId);

        // Collections: Add to SchemeManager LinkedList & PriorityQueue
        schemeManager.enqueueVerificationTask(task);

        // Producer-Consumer: Producer adds to hand-written bounded SchemeReviewQueue
        try {
            schemeReviewQueue.produce(task);
            LOGGER.info("[SchemeVerificationService Producer] Successfully enqueued verification task #" + verif.getId());
        } catch (InterruptedException e) {
            LOGGER.warning("[SchemeVerificationService Producer] Thread interrupted while enqueuing task: " + e.getMessage());
            Thread.currentThread().interrupt();
        }

        return verif;
    }

    public List<SchemeVerification> getAllVerifications() {
        try {
            List<SchemeVerification> list = verificationRepository.findAll();
            if (!list.isEmpty()) return list;
        } catch (Exception ignored) {}

        List<SchemeVerification> list = new ArrayList<>(memoryVerifications.values());
        for (SchemeVerification v : list) {
            if (v.getSchemeName() == null) {
                Scheme s = schemeManager.getById(String.valueOf(v.getSchemeId()));
                if (s != null) v.setSchemeName(s.getName());
            }
        }
        return list;
    }

    public Optional<SchemeVerification> getVerificationById(Integer id) {
        try {
            Optional<SchemeVerification> fromDb = verificationRepository.findById(id);
            if (fromDb.isPresent()) return fromDb;
        } catch (Exception ignored) {}
        return Optional.ofNullable(memoryVerifications.get(id));
    }
}
