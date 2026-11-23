package com.jansetu.model;

import java.sql.Timestamp;

/**
 * SavedScheme association between User and Scheme
 */
public class SavedScheme {
    private Integer id;
    private Integer userId;
    private Integer schemeId;
    private Timestamp savedAt;
    private Scheme scheme; // Optional joined scheme details

    public SavedScheme() {}

    public SavedScheme(Integer userId, Integer schemeId) {
        this.userId = userId;
        this.schemeId = schemeId;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getSchemeId() {
        return schemeId;
    }

    public void setSchemeId(Integer schemeId) {
        this.schemeId = schemeId;
    }

    public Timestamp getSavedAt() {
        return savedAt;
    }

    public void setSavedAt(Timestamp savedAt) {
        this.savedAt = savedAt;
    }

    public Scheme getScheme() {
        return scheme;
    }

    public void setScheme(Scheme scheme) {
        this.scheme = scheme;
    }
}

