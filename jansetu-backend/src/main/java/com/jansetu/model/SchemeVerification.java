package com.jansetu.model;

import java.sql.Timestamp;

/**
 * SchemeVerification entity for admin scheme verification pipeline
 */
public class SchemeVerification {
    private Integer id;
    private Integer schemeId;
    private String status; // PENDING, PROCESSING, VERIFIED, REJECTED
    private Integer priority;
    private String notes;
    private String verifiedBy;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String schemeName; // joined field for frontend display

    public SchemeVerification() {}

    public SchemeVerification(Integer schemeId, Integer priority, String notes) {
        this.schemeId = schemeId;
        this.priority = priority != null ? priority : 1;
        this.notes = notes;
        this.status = "PENDING";
        this.verifiedBy = "Admin Worker";
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(Integer schemeId) {
        this.schemeId = schemeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }
}
