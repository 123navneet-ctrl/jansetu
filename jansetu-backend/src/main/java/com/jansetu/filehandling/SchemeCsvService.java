package com.jansetu.filehandling;

import com.jansetu.model.CsvImportReport;
import com.jansetu.model.Scheme;
import com.jansetu.repository.SchemeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StreamTokenizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * SchemeCsvService
 * Demonstrates Core Java File I/O:
 * - FileReader and BufferedReader with try-with-resources
 * - FileWriter and BufferedWriter with try-with-resources
 * - StreamTokenizer for tokenized parsing
 * - FileInputStream and FileOutputStream for binary backup copying
 */
@Service
public class SchemeCsvService {

    private static final Logger LOGGER = Logger.getLogger(SchemeCsvService.class.getName());

    @Value("${jansetu.storage.export-dir:./exports}")
    private String exportDir;

    @Value("${jansetu.storage.backup-dir:./backups}")
    private String backupDir;

    private final SchemeRepository schemeRepository;

    public SchemeCsvService(SchemeRepository schemeRepository) {
        this.schemeRepository = schemeRepository;
    }

    /**
     * Exports schemes to CSV using FileWriter and BufferedWriter.
     * Then creates a binary backup copy using FileInputStream and FileOutputStream.
     */
    public File exportSchemesToCsv(List<Scheme> schemes) throws IOException {
        File dir = new File(exportDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File targetFile = new File(dir, "schemes_export_" + System.currentTimeMillis() + ".csv");

        // File I/O: FileWriter and BufferedWriter inside try-with-resources
        try (FileWriter fw = new FileWriter(targetFile);
             BufferedWriter writer = new BufferedWriter(fw)) {

            // Write CSV Header
            writer.write("id,name,category,icon,color,match_score,description,benefit,deadline,state,tag,eligibility,documents,how_to_apply,application_link");
            writer.newLine();

            // Write rows
            for (Scheme s : schemes) {
                String line = String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                        s.getId(),
                        escapeCsv(s.getName()),
                        escapeCsv(s.getCategory()),
                        escapeCsv(s.getIcon()),
                        escapeCsv(s.getColor()),
                        s.getMatch() != null ? s.getMatch() : 75,
                        escapeCsv(s.getDescription()),
                        escapeCsv(s.getBenefit()),
                        escapeCsv(s.getDeadline()),
                        escapeCsv(s.getState()),
                        escapeCsv(s.getTag()),
                        escapeCsv(s.getEligibility()),
                        escapeCsv(s.getDocuments()),
                        escapeCsv(s.getHowToApply()),
                        escapeCsv(s.getApplicationLink())
                );
                writer.write(line);
                writer.newLine();
            }
            writer.flush();
        }

        // File I/O: Binary backup using FileInputStream and FileOutputStream
        createBinaryBackup(targetFile);

        LOGGER.info("Exported " + schemes.size() + " schemes to: " + targetFile.getAbsolutePath());
        return targetFile;
    }

    /**
     * File I/O: FileInputStream and FileOutputStream byte-stream copying for binary backup
     */
    private void createBinaryBackup(File sourceFile) {
        File bDir = new File(backupDir);
        if (!bDir.exists()) {
            bDir.mkdirs();
        }

        File backupFile = new File(bDir, "backup_" + sourceFile.getName());

        // File I/O: try-with-resources with FileInputStream and FileOutputStream
        try (FileInputStream fis = new FileInputStream(sourceFile);
             FileOutputStream fos = new FileOutputStream(backupFile)) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
            fos.flush();
            LOGGER.info("Binary backup created at: " + backupFile.getAbsolutePath());
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "Failed to create binary backup: " + e.getMessage(), e);
        }
    }

    /**
     * Imports schemes from a CSV file.
     * Flow: parse via FileReader/BufferedReader, validate, ArrayList + HashSet duplicate check, JDBC insert.
     */
    public CsvImportReport importSchemesFromCsv(File file) {
        CsvImportReport report = new CsvImportReport();

        // Collections: ArrayList to collect valid parsed records
        List<Scheme> validSchemes = new ArrayList<>();

        // Collections: HashSet to track and reject duplicate scheme IDs
        Set<Integer> seenIds = new HashSet<>();

        // Also seed seenIds with existing IDs from the database to avoid duplicate key conflicts
        try {
            for (Scheme existing : schemeRepository.findAll()) {
                if (existing.getId() != null) {
                    seenIds.add(existing.getId());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Could not pre-load existing scheme IDs: " + e.getMessage());
        }

        // File I/O: FileReader and BufferedReader with try-with-resources
        try (FileReader fr = new FileReader(file);
             BufferedReader reader = new BufferedReader(fr)) {

            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (lineNumber == 1 && line.toLowerCase().startsWith("id,")) {
                    continue; // Skip header row
                }

                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                report.setTotalRows(report.getTotalRows() + 1);

                try {
                    Scheme scheme = parseCsvLine(trimmed);

                    if (scheme.getName() == null || scheme.getName().trim().isEmpty()) {
                        report.addInvalidRow(lineNumber, "Missing required field 'name'");
                        continue;
                    }
                    if (scheme.getCategory() == null || scheme.getCategory().trim().isEmpty()) {
                        report.addInvalidRow(lineNumber, "Missing required field 'category'");
                        continue;
                    }

                    // Collections: HashSet duplicate check
                    if (seenIds.contains(scheme.getId())) {
                        report.setDuplicatesSkipped(report.getDuplicatesSkipped() + 1);
                        continue;
                    }

                    seenIds.add(scheme.getId());
                    validSchemes.add(scheme);

                } catch (Exception e) {
                    report.addInvalidRow(lineNumber, "Parse error: " + e.getMessage());
                }
            }

            // JDBC: Batch insert all valid schemes
            if (!validSchemes.isEmpty()) {
                try {
                    int inserted = schemeRepository.saveAll(validSchemes);
                    report.setImportedCount(inserted);
                } catch (Exception dbEx) {
                    LOGGER.warning("Database insert failed/unavailable: " + dbEx.getMessage());
                    report.setImportedCount(validSchemes.size());
                    report.addError("Database offline, records validated in-memory (" + dbEx.getMessage() + ")");
                }
            }

        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "I/O error reading CSV file: " + e.getMessage(), e);
            report.addError("Failed to read file: " + e.getMessage());
        }

        return report;
    }

    /**
     * File I/O: Second parsing path demonstrating StreamTokenizer on CSV tokens
     */
    public List<Integer> extractNumericIdsUsingStreamTokenizer(File file) {
        List<Integer> ids = new ArrayList<>();

        // File I/O: StreamTokenizer demonstration
        try (FileReader fr = new FileReader(file);
             BufferedReader br = new BufferedReader(fr)) {

            StreamTokenizer tokenizer = new StreamTokenizer(br);
            tokenizer.eolIsSignificant(true);
            tokenizer.wordChars('_', '_');

            while (tokenizer.nextToken() != StreamTokenizer.TT_EOF) {
                if (tokenizer.ttype == StreamTokenizer.TT_NUMBER) {
                    ids.add((int) tokenizer.nval);
                }
            }
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, "StreamTokenizer parsing exception: " + e.getMessage(), e);
        }
        return ids;
    }

    private Scheme parseCsvLine(String line) {
        List<String> tokens = parseCsvTokens(line);
        if (tokens.size() < 3) {
            throw new IllegalArgumentException("Insufficient columns, expected at least 3");
        }

        Scheme s = new Scheme();
        s.setId(Integer.parseInt(tokens.get(0).trim()));
        s.setName(tokens.get(1).trim());
        s.setCategory(tokens.size() > 2 ? tokens.get(2).trim() : "General");
        s.setIcon(tokens.size() > 3 ? tokens.get(3).trim() : "✦");
        s.setColor(tokens.size() > 4 ? tokens.get(4).trim() : "blue");
        s.setMatch(tokens.size() > 5 && !tokens.get(5).trim().isEmpty() ? Integer.parseInt(tokens.get(5).trim()) : 75);
        s.setDescription(tokens.size() > 6 ? tokens.get(6).trim() : "");
        s.setBenefit(tokens.size() > 7 ? tokens.get(7).trim() : "");
        s.setDeadline(tokens.size() > 8 ? tokens.get(8).trim() : "Open");
        s.setState(tokens.size() > 9 ? tokens.get(9).trim() : "All India");
        s.setTag(tokens.size() > 10 ? tokens.get(10).trim() : "General");
        s.setEligibility(tokens.size() > 11 ? tokens.get(11).trim() : "");
        s.setDocuments(tokens.size() > 12 ? tokens.get(12).trim() : "");
        s.setHowToApply(tokens.size() > 13 ? tokens.get(13).trim() : "");
        s.setApplicationLink(tokens.size() > 14 ? tokens.get(14).trim() : "");
        return s;
    }

    private List<String> parseCsvTokens(String line) {
        List<String> list = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                list.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        list.add(sb.toString());
        return list;
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }
}
