package com.jansetu.concurrency;

import com.jansetu.model.VerificationTask;
import org.springframework.stereotype.Component;

import java.util.LinkedList;
import java.util.Queue;
import java.util.logging.Logger;

/**
 * Hand-written BOUNDED Producer-Consumer Queue for Admin Scheme Verifications
 *
 * Concurrency: Demonstrates synchronized methods, wait(), and notifyAll()
 * in guarded while-loops for thread-safe producer-consumer communication.
 */
@Component
public class SchemeReviewQueue {

    private static final Logger LOGGER = Logger.getLogger(SchemeReviewQueue.class.getName());

    // Collections: LinkedList as the underlying FIFO storage for the bounded queue
    private final Queue<VerificationTask> buffer = new LinkedList<>();

    // Bounded capacity to demonstrate blocking when queue is full
    private final int capacity;

    // Concurrency: volatile flag for graceful shutdown
    private volatile boolean running = true;

    public SchemeReviewQueue() {
        this(20); // Default capacity of 20 tasks
    }

    public SchemeReviewQueue(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Producer method: Adds a VerificationTask to the bounded queue.
     * Blocks if buffer is full using guarded while loop.
     */
    // Producer-Consumer: synchronized method with wait() and notifyAll() in guarded while-loop
    public synchronized void produce(VerificationTask task) throws InterruptedException {
        while (buffer.size() >= capacity && running) {
            LOGGER.info("[SchemeReviewQueue Producer] Queue full (" + buffer.size() + "/" + capacity + "). Waiting for space...");
            // Concurrency: wait() releases intrinsic lock until notified
            wait();
        }

        if (!running) {
            throw new InterruptedException("SchemeReviewQueue is shutting down, task rejected.");
        }

        buffer.add(task);
        LOGGER.info("[SchemeReviewQueue Producer] Enqueued task for task #" + task.getTaskId() + ". Queue size: " + buffer.size());

        // Concurrency: notifyAll() wakes up waiting consumer threads
        notifyAll();
    }

    /**
     * Consumer method: Retrieves and removes next VerificationTask from queue.
     * Blocks if buffer is empty using guarded while loop.
     */
    // Producer-Consumer: synchronized method with wait() in guarded while-loop
    public synchronized VerificationTask consume() throws InterruptedException {
        while (buffer.isEmpty() && running) {
            // Concurrency: wait() in guarded loop until an item is produced or stopped
            wait();
        }

        if (!running && buffer.isEmpty()) {
            return null; // Signals worker to terminate cleanly
        }

        VerificationTask task = buffer.poll();
        LOGGER.info("[SchemeReviewQueue Consumer] Dequeued task for task #" + (task != null ? task.getTaskId() : "null") + ". Queue size: " + buffer.size());

        // Concurrency: notifyAll() wakes up any waiting producers
        notifyAll();

        return task;
    }

    public synchronized int size() {
        return buffer.size();
    }

    public synchronized boolean isFull() {
        return buffer.size() >= capacity;
    }

    public synchronized boolean isEmpty() {
        return buffer.isEmpty();
    }

    /**
     * Shuts down the queue and wakes up any waiting threads.
     */
    public synchronized void shutdown() {
        running = false;
        notifyAll();
        LOGGER.info("[SchemeReviewQueue] Shutdown signal issued.");
    }
}
