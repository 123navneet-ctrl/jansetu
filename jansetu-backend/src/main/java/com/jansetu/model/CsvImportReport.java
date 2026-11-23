package com.jansetu.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Report summary for CSV Import operations
 */
public class CsvImportReport {
    private int totalRows;
    private int importedCount;
    private int duplicatesSkipped;
    private final List<String> invalidRows = new ArrayList<>();
    private final List<String> errors = new ArrayList<>();

    public CsvImportReport() {}

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getImportedCount() {
        return importedCount;
    }

    public void setImportedCount(int importedCount) {
        this.importedCount = importedCount;
    }

    public int getDuplicatesSkipped() {
        return duplicatesSkipped;
    }

    public void setDuplicatesSkipped(int duplicatesSkipped) {
        this.duplicatesSkipped = duplicatesSkipped;
    }

    public List<String> getInvalidRows() {
        return invalidRows;
    }

    public void addInvalidRow(int lineNumber, String reason) {
        this.invalidRows.add("Line " + lineNumber + ": " + reason);
    }

    public List<String> getErrors() {
        return errors;
    }

    public void addError(String error) {
        this.errors.add(error);
    }
}

