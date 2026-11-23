package com.jansetu.model;

import java.time.Instant;

/**
 * VerificationTask used in Collections and Producer-Consumer Concurrency
 *
 * Comparable: Implements Comparable<VerificationTask> so that PriorityQueue
 * orders higher priority verification tasks (e.g. priority 5 > 1) first,
 * breaking ties by earlier submission timestamp (FIFO).
 */
public class VerificationTask implements Comparable<VerificationTask> {
    private final Integer taskId;
    private final Integer schemeId;
    private final int priority;
    private final long submittedAt;
    private final String description;

    public VerificationTask(Integer taskId, Integer schemeId, int priority, String description) {
        this.taskId = taskId;
        this.schemeId = schemeId;
        this.priority = priority;
        this.submittedAt = Instant.now().toEpochMilli();
        this.description = description;
    }

    // Comparable: Higher priority first (descending), then older submitted timestamp (FIFO tie-break)
    @Override
    public int compareTo(VerificationTask other) {
        if (other == null) return -1;
        int cmp = Integer.compare(other.priority, this.priority);
        if (cmp != 0) return cmp;
        return Long.compare(this.submittedAt, other.submittedAt);
    }

    public Integer getTaskId() {
        return taskId;
    }

    public Integer getSchemeId() {
        return schemeId;
    }

    public int getPriority() {
        return priority;
    }

    public long getSubmittedAt() {
        return submittedAt;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return "VerificationTask{" +
                "taskId=" + taskId +
                ", schemeId=" + schemeId +
                ", priority=" + priority +
                ", submittedAt=" + submittedAt +
                ", description='" + description + '\'' +
                '}';
    }
}
