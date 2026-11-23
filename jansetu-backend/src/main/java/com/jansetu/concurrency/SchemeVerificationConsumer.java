package com.jansetu.concurrency;

import com.jansetu.model.VerificationTask;
import com.jansetu.repository.VerificationRepository;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Consumer thread that continuously takes verification tasks from SchemeReviewQueue
 * and updates their status in MySQL via JDBC (PENDING -> PROCESSING -> VERIFIED).
 *
 * Concurrency: Demonstrates Thread lifecycle (start, run, sleep, interrupt, join).
 */
@Component
public class SchemeVerificationConsumer implements Runnable {

    private static final Logger LOGGER = Logger.getLogger(SchemeVerificationConsumer.class.getName());

    private final SchemeReviewQueue schemeReviewQueue;
    private final VerificationRepository verificationRepository;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.jansetu.service.SchemeVerificationService verificationService;

    private Thread consumerThread;
    // Concurrency: volatile flag for clean shutdown
    private volatile boolean running = true;

    public SchemeVerificationConsumer(SchemeReviewQueue schemeReviewQueue, VerificationRepository verificationRepository) {
        this.schemeReviewQueue = schemeReviewQueue;
        this.verificationRepository = verificationRepository;
    }

    // Multithreading: Start the consumer thread on application startup
    @PostConstruct
    public synchronized void start() {
        consumerThread = new Thread(this, "JanSetu-SchemeVerification-Thread");
        consumerThread.setDaemon(true);
        // Multithreading: start() initiates new native thread
        consumerThread.start();
        LOGGER.info("[SchemeVerificationConsumer] Started background thread: " + consumerThread.getName()
                + " (State: " + consumerThread.getState() + ")");
    }

    // Multithreading: Runnable.run() method containing the consumer execution loop
    @Override
    public void run() {
        LOGGER.info("[SchemeVerificationConsumer] Consumer thread is active and listening for verification tasks.");

        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                // Producer-Consumer: consume() blocks until a task is available
                VerificationTask task = schemeReviewQueue.consume();
                if (task == null) {
                    break; // Queue shut down
                }

                LOGGER.info("[SchemeVerificationConsumer] Processing task #" + task.getTaskId()
                        + " for scheme #" + task.getSchemeId() + " (Priority: " + task.getPriority() + ")");

                // JDBC: Update status to PROCESSING
                verificationRepository.updateStatus(task.getTaskId(), "PROCESSING");
                if (verificationService != null) {
                    verificationService.getVerificationById(task.getTaskId()).ifPresent(v -> v.setStatus("PROCESSING"));
                }

                // Multithreading: Thread.sleep() simulating verification and audit checks
                Thread.sleep(2000);

                // JDBC: Update status to VERIFIED
                verificationRepository.updateStatus(task.getTaskId(), "VERIFIED");
                if (verificationService != null) {
                    verificationService.getVerificationById(task.getTaskId()).ifPresent(v -> v.setStatus("VERIFIED"));
                }

                LOGGER.info("[SchemeVerificationConsumer] Successfully verified scheme task #" + task.getTaskId());

            } catch (InterruptedException e) {
                LOGGER.info("[SchemeVerificationConsumer] Thread interrupted during wait/sleep, preparing to stop.");
                // Multithreading: Preserve interrupt status
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "[SchemeVerificationConsumer] Error processing verification task: " + e.getMessage(), e);
            }
        }

        LOGGER.info("[SchemeVerificationConsumer] Background consumer thread exiting.");
    }

    // Multithreading: Clean shutdown on application termination
    @PreDestroy
    public synchronized void stop() {
        running = false;
        schemeReviewQueue.shutdown();
        if (consumerThread != null && consumerThread.isAlive()) {
            consumerThread.interrupt();
            try {
                // Multithreading: join() waits for thread termination up to 1500ms
                consumerThread.join(1500);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
        LOGGER.info("[SchemeVerificationConsumer] Consumer thread stopped gracefully.");
    }

    public Thread.State getThreadState() {
        return consumerThread != null ? consumerThread.getState() : Thread.State.TERMINATED;
    }
}
