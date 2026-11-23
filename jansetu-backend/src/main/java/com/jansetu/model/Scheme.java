package com.jansetu.model;

import java.sql.Timestamp;
import java.util.Comparator;
import java.util.Objects;

/**
 * Scheme Entity matching src/data/schemes.js
 *
 * Comparable: Scheme implements Comparable<Scheme> comparing by name in case-insensitive order.
 */
public class Scheme implements Comparable<Scheme> {
    private Integer id;
    private String name;
    private String category;
    private String icon;
    private String color;
    private Integer match; // match_score
    private String description;
    private String benefit;
    private String deadline;
    private String state;
    private String tag;
    private String eligibility;
    private String documents;
    private String howToApply;
    private String applicationLink;
    private Timestamp createdAt;

    // Comparators: Custom Comparators for sorting schemes
    public static final Comparator<Scheme> BY_STATE =
            Comparator.comparing(Scheme::getState, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));

    public static final Comparator<Scheme> BY_CATEGORY =
            Comparator.comparing(Scheme::getCategory, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));

    public static final Comparator<Scheme> BY_PRIORITY =
            Comparator.comparingInt((Scheme s) -> s.getMatch() != null ? s.getMatch() : 0).reversed();

    public Scheme() {}

    public Scheme(Integer id, String name, String category, String state, Integer match) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.state = state;
        this.match = match;
    }

    // Comparable: Natural sorting by scheme name (case-insensitive)
    @Override
    public int compareTo(Scheme other) {
        if (other == null || other.name == null) return 1;
        if (this.name == null) return -1;
        return this.name.compareToIgnoreCase(other.name);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Scheme scheme = (Scheme) o;
        return Objects.equals(id, scheme.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getMatch() {
        return match;
    }

    public void setMatch(Integer match) {
        this.match = match;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBenefit() {
        return benefit;
    }

    public void setBenefit(String benefit) {
        this.benefit = benefit;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getEligibility() {
        return eligibility;
    }

    public void setEligibility(String eligibility) {
        this.eligibility = eligibility;
    }

    public String getDocuments() {
        return documents;
    }

    public void setDocuments(String documents) {
        this.documents = documents;
    }

    public String getHowToApply() {
        return howToApply;
    }

    public void setHowToApply(String howToApply) {
        this.howToApply = howToApply;
    }

    public String getApplicationLink() {
        return applicationLink;
    }

    public void setApplicationLink(String applicationLink) {
        this.applicationLink = applicationLink;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Scheme{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", category='" + category + '\'' +
                ", state='" + state + '\'' +
                ", match=" + match +
                '}';
    }
}

