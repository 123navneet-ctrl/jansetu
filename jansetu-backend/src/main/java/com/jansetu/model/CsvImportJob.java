package com.jansetu.model;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * CsvImportJob tracking asynchronous CSV processing
 *
 * Concurrency: Uses AtomicInteger and volatile variables for thread-safe state tracking.
 */
public class CsvImportJob {
    private final String jobId;
    private final String filename;
    private volatile String status; // QUEUED, VALIDATING, CHECKING_DUPLICATES, STORING, COMPLETED, FAILED, CANCELLED
    private volatile String threadState; // Logs Thread.getState().name()
    private final AtomicInteger progressPercent = new AtomicInteger(0);
    private final AtomicInteger processedRows = new AtomicInteger(0);
    private final AtomicInteger totalRows = new AtomicInteger(0);
    private volatile String message;
    private volatile CsvImportReport report;
    private final long createdAt;
    private volatile long completedAt;

    public CsvImportJob(String jobId, String filename) {
        this.jobId = jobId;
        this.filename = filename;
        this.status = "QUEUED";
        this.threadState = "NEW";
        this.message = "Job scheduled and queued for background worker";
        this.createdAt = System.currentTimeMillis();
    }

    public String getJobId() {
        return jobId;
    }

    public String getFilename() {
        return filename;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getThreadState() {
        return threadState;
    }

    public void setThreadState(String threadState) {
        this.threadState = threadState;
    }

    public int getProgressPercent() {
        return progressPercent.get();
    }

    public void setProgressPercent(int value) {
        this.progressPercent.set(value);
    }

    public int getProcessedRows() {
        return processedRows.get();
    }

    public void incrementProcessedRows() {
        this.processedRows.incrementAndGet();
    }

    public int getTotalRows() {
        return totalRows.get();
    }

    public void setTotalRows(int value) {
        this.totalRows.set(value);
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public CsvImportReport getReport() {
        return report;
    }

    public void setReport(CsvImportReport report) {
        this.report = report;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public long getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(long completedAt) {
        this.completedAt = completedAt;
    }
}

