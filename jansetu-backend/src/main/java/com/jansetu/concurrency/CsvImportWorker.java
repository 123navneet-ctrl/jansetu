package com.jansetu.concurrency;

import com.jansetu.collections.SchemeManager;
import com.jansetu.filehandling.SchemeCsvService;
import com.jansetu.model.CsvImportJob;
import com.jansetu.model.CsvImportReport;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * CsvImportWorker executes the CSV parsing and database import pipeline on a dedicated background Thread.
 *
 * Concurrency: Demonstrates Runnable, start(), run(), sleep(), join(), interrupt(),
 * Thread.getState(), synchronized blocks, volatile flags, and AtomicInteger progress.
 */
public class CsvImportWorker implements Runnable {

    private static final Logger LOGGER = Logger.getLogger(CsvImportWorker.class.getName());

    private final CsvImportJob job;
    private final File csvFile;
    private final SchemeCsvService csvService;
    private final SchemeManager schemeManager;

    private Thread workerThread;
    // Concurrency: volatile cancellation flag
    private volatile boolean cancelled = false;

    public CsvImportWorker(CsvImportJob job, File csvFile, SchemeCsvService csvService, SchemeManager schemeManager) {
        this.job = job;
        this.csvFile = csvFile;
        this.csvService = csvService;
        this.schemeManager = schemeManager;
    }

    /**
     * Multithreading: start() initiates the background worker thread
     */
    public synchronized void start() {
        workerThread = new Thread(this, "JanSetu-CsvWorker-" + job.getJobId());
        workerThread.setDaemon(true);
        // Multithreading: Log initial thread state
        job.setThreadState(workerThread.getState().name());
        workerThread.start();
        LOGGER.info("[CsvImportWorker] Thread started: " + workerThread.getName()
                + " (Initial State: " + workerThread.getState() + ")");
    }

    /**
     * Multithreading: run() executes the pipeline: VALIDATE -> DEDUP -> STORE -> UPDATE
     */
    @Override
    public void run() {
        LOGGER.info("[CsvImportWorker] Starting pipeline for job " + job.getJobId()
                + " on Thread state: " + Thread.currentThread().getState());

        try {
            updateJobState("VALIDATING", 20, "Validating CSV structure and headers...");
            // Multithreading: Thread.sleep() simulating pipeline step execution
            Thread.sleep(600);
            checkInterrupted();

            updateJobState("CHECKING_DUPLICATES", 50, "Checking for duplicate scheme IDs against database...");
            Thread.sleep(600);
            checkInterrupted();

            updateJobState("STORING", 75, "Inserting validated scheme records via JDBC...");
            Thread.sleep(600);
            checkInterrupted();

            // Synchronization: Synchronized block protecting scheme updates against race conditions
            CsvImportReport report;
            synchronized (schemeManager) {
                report = csvService.importSchemesFromCsv(csvFile);
                schemeManager.reloadFromDatabase();
            }

            // Final completion update
            synchronized (job) {
                job.setReport(report);
                job.setTotalRows(report.getTotalRows());
                job.setStatus("COMPLETED");
                job.setProgressPercent(100);
                job.setMessage("Successfully processed " + report.getImportedCount() + " schemes ("
                        + report.getDuplicatesSkipped() + " duplicates skipped).");
                job.setCompletedAt(System.currentTimeMillis());
                job.setThreadState(Thread.currentThread().getState().name());
            }

            LOGGER.info("[CsvImportWorker] Job " + job.getJobId() + " finished successfully. Thread State: "
                    + Thread.currentThread().getState());

        } catch (InterruptedException e) {
            // Multithreading: Catching InterruptedException and setting CANCELLED status
            LOGGER.info("[CsvImportWorker] Job " + job.getJobId() + " was interrupted via cancel request.");
            synchronized (job) {
                job.setStatus("CANCELLED");
                job.setMessage("Import job was cancelled by administrator (Thread interrupted).");
                job.setCompletedAt(System.currentTimeMillis());
                job.setThreadState(Thread.currentThread().getState().name());
            }
            Thread.currentThread().interrupt();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "[CsvImportWorker] Job failed: " + e.getMessage(), e);
            synchronized (job) {
                job.setStatus("FAILED");
                job.setMessage("Import failed: " + e.getMessage());
                job.setCompletedAt(System.currentTimeMillis());
                job.setThreadState(Thread.currentThread().getState().name());
            }
        }
    }

    private void checkInterrupted() throws InterruptedException {
        // Multithreading: Demonstrates isInterrupted() check
        if (cancelled || Thread.currentThread().isInterrupted()) {
            throw new InterruptedException("Worker interrupted");
        }
    }

    /**
     * Synchronization: Synchronized method to safely update shared CsvImportJob state
     */
    private synchronized void updateJobState(String status, int progress, String message) {
        job.setStatus(status);
        job.setProgressPercent(progress);
        job.setMessage(message);
        if (workerThread != null) {
            // Multithreading: Log and store current Thread.getState()
            job.setThreadState(workerThread.getState().name());
            LOGGER.info("[Job " + job.getJobId() + "] Status: " + status + " (" + progress + "%) | Thread State: "
                    + workerThread.getState());
        }
    }

    /**
     * Multithreading: interrupt() allows cancelling a running job
     */
    public synchronized boolean interrupt() {
        cancelled = true;
        if (workerThread != null && workerThread.isAlive()) {
            LOGGER.info("[CsvImportWorker] Sending interrupt() to thread: " + workerThread.getName());
            workerThread.interrupt();
            job.setThreadState(workerThread.getState().name());
            return true;
        }
        return false;
    }

    /**
     * Multithreading: join() waits for thread completion (useful for synchronous waiting / testing)
     */
    public void join(long millis) throws InterruptedException {
        if (workerThread != null) {
            workerThread.join(millis);
        }
    }

    public Thread getWorkerThread() {
        return workerThread;
    }

    public CsvImportJob getJob() {
        return job;
    }
}

