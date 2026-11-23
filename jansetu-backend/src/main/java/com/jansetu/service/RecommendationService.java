package com.jansetu.service;

import com.jansetu.collections.SchemeManager;
import com.jansetu.model.Scheme;
import com.jansetu.model.User;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * RecommendationService
 *
 * Demonstrates Java 8+ Streams API, Lambdas, Method References, Comparable, and Comparators.
 */
@Service
public class RecommendationService {

    private static final Logger LOGGER = Logger.getLogger(RecommendationService.class.getName());
    private final SchemeManager schemeManager;

    public RecommendationService(SchemeManager schemeManager) {
        this.schemeManager = schemeManager;
    }

    /**
     * Recommends schemes for a user using Streams pipeline:
     * filter, map, sorted, distinct, skip, limit, collect
     */
    public Map<String, Object> recommend(User user, int page, int size, String sort) {
        List<Scheme> all = schemeManager.getAllSchemes();

        final String userState = user != null && user.getState() != null ? user.getState().trim() : "Punjab";
        final int userAge = user != null && user.getAge() != null ? user.getAge() : 20;
        final String userOccupation = user != null && user.getOccupation() != null ? user.getOccupation().trim() : "Student";
        final long userIncome = parseIncome(user != null ? user.getAnnualIncome() : null);

        // Comparator selection based on parameter
        Comparator<Scheme> comparator;
        if ("state".equalsIgnoreCase(sort)) {
            // Comparators: Using Scheme.BY_STATE comparator
            comparator = Scheme.BY_STATE;
        } else if ("category".equalsIgnoreCase(sort)) {
            // Comparators: Using Scheme.BY_CATEGORY comparator
            comparator = Scheme.BY_CATEGORY;
        } else if ("name".equalsIgnoreCase(sort)) {
            // Comparable: Natural order comparison (Scheme::compareTo)
            comparator = Comparator.naturalOrder();
        } else {
            // Comparators: Priority / Match score comparator (default)
            comparator = Scheme.BY_PRIORITY;
        }

        // Streams: filter by state, age, and income using Lambdas and Method References
        List<Scheme> filteredAndRanked = all.stream()
                // Streams: filter by geographic applicability
                .filter(s -> {
                    String sState = s.getState();
                    if (sState == null || sState.isEmpty() || sState.equalsIgnoreCase("All India")
                            || sState.equalsIgnoreCase("State dependent")
                            || sState.equalsIgnoreCase("Participating states")) {
                        return true;
                    }
                    return sState.equalsIgnoreCase(userState);
                })
                // Streams: filter based on demographic heuristics (age/income/occupation)
                .filter(s -> matchesDemographics(s, userAge, userIncome, userOccupation))
                // Streams: map to dynamically adjust match score based on user profile fit
                .map(s -> calculateDynamicFit(s, user))
                // Streams: distinct to eliminate any duplicate scheme objects
                .distinct()
                // Streams: sorted using selected Comparator or natural Comparable
                .sorted(comparator)
                // Streams: collect into intermediate list to determine total matching count
                .collect(Collectors.toList());

        // Generics: Using bounded-type utility GenericsUtility.max() to identify the top scheme
        Scheme topScheme = GenericsUtility.max(filteredAndRanked);
        if (topScheme != null) {
            LOGGER.info("Top recommended scheme for user (" + (user != null ? user.getEmail() : "guest") + "): " + topScheme.getName());
        }

        int totalCount = filteredAndRanked.size();
        int safePage = Math.max(0, page);
        int safeSize = size > 0 ? size : 10;
        int skip = safePage * safeSize;

        // Streams: pagination using skip() and limit(), then collect()
        List<Scheme> paginatedResults = filteredAndRanked.stream()
                // Streams: skip for offset
                .skip(skip)
                // Streams: limit for page size
                .limit(safeSize)
                // Streams: collect to List
                .collect(Collectors.toList());

        // Streams: demonstration of method reference (Scheme::getName) in logging/mapping
        List<String> schemeNames = paginatedResults.stream()
                .map(Scheme::getName)
                .collect(Collectors.toList());
        LOGGER.fine("Page " + safePage + " scheme names: " + schemeNames);

        Map<String, Object> response = new HashMap<>();
        response.put("results", paginatedResults);
        response.put("page", safePage);
        response.put("size", safeSize);
        response.put("total", totalCount);
        response.put("totalPages", (int) Math.ceil((double) totalCount / safeSize));
        // Disclaimer explicitly required by rule
        response.put("disclaimer", "Preliminary suggestions based on your profile. Check the official scheme website for actual eligibility.");

        return response;
    }

    private boolean matchesDemographics(Scheme s, int age, long income, String occupation) {
        String cat = s.getCategory() != null ? s.getCategory() : "";
        String text = (s.getEligibility() + " " + s.getDescription()).toLowerCase();

        // Senior citizen scheme check
        if (cat.equalsIgnoreCase("Senior Citizens") || text.contains("senior citizen") || text.contains("old age")) {
            if (age < 60) return false;
        }

        // Student scholarships check
        if (cat.equalsIgnoreCase("Education") || text.contains("student") || text.contains("scholarship")) {
            if (age > 35 && !occupation.equalsIgnoreCase("Student")) return false;
        }

        // Income threshold check if mentioned in eligibility text (e.g. 3.5 lakh)
        if (text.contains("3.5 lakh") && income > 350000) {
            return false;
        }
        if (text.contains("bpl") || text.contains("below poverty line")) {
            if (income > 200000) return false;
        }

        return true;
    }

    private Scheme calculateDynamicFit(Scheme original, User user) {
        // Clone scheme to avoid mutating cached singleton
        Scheme copy = new Scheme();
        copy.setId(original.getId());
        copy.setName(original.getName());
        copy.setCategory(original.getCategory());
        copy.setIcon(original.getIcon());
        copy.setColor(original.getColor());
        copy.setDescription(original.getDescription());
        copy.setBenefit(original.getBenefit());
        copy.setDeadline(original.getDeadline());
        copy.setState(original.getState());
        copy.setTag(original.getTag());
        copy.setEligibility(original.getEligibility());
        copy.setDocuments(original.getDocuments());
        copy.setHowToApply(original.getHowToApply());
        copy.setApplicationLink(original.getApplicationLink());
        copy.setCreatedAt(original.getCreatedAt());

        int baseMatch = original.getMatch() != null ? original.getMatch() : 70;
        if (user != null) {
            if (user.getOccupation() != null && original.getDescription() != null
                    && original.getDescription().toLowerCase().contains(user.getOccupation().toLowerCase())) {
                baseMatch += 8;
            }
            if (user.getState() != null && original.getState() != null
                    && original.getState().equalsIgnoreCase(user.getState())) {
                baseMatch += 5;
            }
        }
        copy.setMatch(Math.min(99, Math.max(50, baseMatch)));
        return copy;
    }

    private long parseIncome(String incomeStr) {
        if (incomeStr == null || incomeStr.isEmpty()) return 150000;
        String lower = incomeStr.toLowerCase();
        if (lower.contains("below") || lower.contains("1 lakh")) return 75000;
        if (lower.contains("1–2.5") || lower.contains("1-2.5")) return 175000;
        if (lower.contains("2.5–5") || lower.contains("2.5-5")) return 375000;
        if (lower.contains("5–10") || lower.contains("5-10")) return 750000;
        if (lower.contains("above") || lower.contains("10 lakh")) return 1200000;
        try {
            return Long.parseLong(incomeStr.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 150000;
        }
    }
}

