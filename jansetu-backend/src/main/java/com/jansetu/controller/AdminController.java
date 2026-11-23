package com.jansetu.controller;

import com.jansetu.collections.SchemeManager;
import com.jansetu.concurrency.CsvImportWorker;
import com.jansetu.concurrency.JobRegistry;
import com.jansetu.filehandling.SchemeCsvService;
import com.jansetu.model.CsvImportJob;
import com.jansetu.model.CsvImportReport;
import com.jansetu.model.Scheme;
import com.jansetu.service.SchemeService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * REST API Controller for Administration, CSV Import/Export, and Multithreaded Job Management
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger LOGGER = Logger.getLogger(AdminController.class.getName());

    private final SchemeCsvService csvService;
    private final SchemeService schemeService;
    private final SchemeManager schemeManager;
    private final JobRegistry jobRegistry;

    public AdminController(SchemeCsvService csvService,
                           SchemeService schemeService,
                           SchemeManager schemeManager,
                           JobRegistry jobRegistry) {
        this.csvService = csvService;
        this.schemeService = schemeService;
        this.schemeManager = schemeManager;
        this.jobRegistry = jobRegistry;
    }

    /**
     * File I/O: Synchronous CSV Import
     */
    @PostMapping(value = "/schemes/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvImportReport> importSchemesSync(@RequestParam("file") MultipartFile file) throws IOException {
        File tempFile = File.createTempFile("jansetu_upload_", ".csv");
        file.transferTo(tempFile);

        CsvImportReport report = csvService.importSchemesFromCsv(tempFile);
        schemeManager.reloadFromDatabase();
        tempFile.deleteOnExit();

        return ResponseEntity.ok(report);
    }

    /**
     * Multithreading: Asynchronous CSV Import executing on a background Thread (Runnable)
     * Returns job ID immediately.
     */
    @PostMapping("/schemes/import-async")
    public ResponseEntity<Map<String, Object>> importSchemesAsync(
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        String jobId = "job-" + UUID.randomUUID().toString().substring(0, 8);
        File targetFile;

        if (file != null && !file.isEmpty()) {
            targetFile = File.createTempFile("jansetu_async_", ".csv");
            file.transferTo(targetFile);
        } else {
            // Default: use the bundled schemes.csv resource seed
            ClassPathResource defaultSeed = new ClassPathResource("schemes.csv");
            targetFile = File.createTempFile("jansetu_seed_", ".csv");
            try (InputStream in = defaultSeed.getInputStream();
                 FileOutputStream out = new FileOutputStream(targetFile)) {
                byte[] buf = new byte[4096];
                int len;
                while ((len = in.read(buf)) != -1) {
                    out.write(buf, 0, len);
                }
            }
        }

        CsvImportJob job = new CsvImportJob(jobId, targetFile.getName());
        CsvImportWorker worker = new CsvImportWorker(job, targetFile, csvService, schemeManager);

        jobRegistry.registerJob(job, worker);

        // Multithreading: start() background worker thread
        worker.start();

        Map<String, Object> resp = new HashMap<>();
        resp.put("jobId", jobId);
        resp.put("status", job.getStatus());
        resp.put("message", "CSV import task has started on a dedicated background thread.");
        resp.put("threadState", job.getThreadState());

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(resp);
    }

    /**
     * Multithreading: Poll status and progress of background Thread job
     */
    @GetMapping("/jobs/{id}")
    public ResponseEntity<CsvImportJob> getJobStatus(@PathVariable String id) {
        return jobRegistry.getJob(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Multithreading: Cancel a running background job using Thread.interrupt()
     */
    @PostMapping("/jobs/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelJob(@PathVariable String id) {
        boolean cancelled = jobRegistry.cancelJob(id);
        Map<String, Object> resp = new HashMap<>();
        resp.put("jobId", id);
        resp.put("cancelled", cancelled);
        resp.put("message", cancelled ? "Thread interrupt sent to background worker." : "Job could not be cancelled or was already completed.");
        return ResponseEntity.ok(resp);
    }

    /**
     * File I/O: Export all schemes to CSV with binary backup
     */
    @GetMapping("/schemes/export")
    public ResponseEntity<Resource> exportSchemes() throws IOException {
        List<Scheme> list = schemeService.getAllSchemes();
        File exportedFile = csvService.exportSchemesToCsv(list);

        Resource resource = new FileSystemResource(exportedFile);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + exportedFile.getName() + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(exportedFile.length())
                .body(resource);
    }
}

