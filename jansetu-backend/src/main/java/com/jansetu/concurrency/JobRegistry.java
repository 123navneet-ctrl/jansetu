package com.jansetu.concurrency;

import com.jansetu.model.CsvImportJob;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe registry holding active and completed CSV jobs and workers
 */
@Component
public class JobRegistry {

    // Concurrency: ConcurrentHashMap for thread-safe access without external locking
    private final Map<String, CsvImportJob> jobs = new ConcurrentHashMap<>();
    private final Map<String, CsvImportWorker> workers = new ConcurrentHashMap<>();

    public void registerJob(CsvImportJob job, CsvImportWorker worker) {
        jobs.put(job.getJobId(), job);
        workers.put(job.getJobId(), worker);
    }

    public Optional<CsvImportJob> getJob(String jobId) {
        CsvImportJob job = jobs.get(jobId);
        if (job != null) {
            CsvImportWorker worker = workers.get(jobId);
            if (worker != null && worker.getWorkerThread() != null) {
                // Keep live Thread.getState() refreshed
                job.setThreadState(worker.getWorkerThread().getState().name());
            }
        }
        return Optional.ofNullable(job);
    }

    public boolean cancelJob(String jobId) {
        CsvImportWorker worker = workers.get(jobId);
        if (worker != null) {
            return worker.interrupt();
        }
        return false;
    }

    public List<CsvImportJob> getAllJobs() {
        return new ArrayList<>(jobs.values());
    }
}

