package com.jansetu.collections;

import com.jansetu.model.Scheme;
import com.jansetu.model.VerificationTask;
import com.jansetu.repository.SchemeRepository;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.logging.Logger;

/**
 * SchemeManager: Demonstrates Core Java Collections in Real Working Features
 * Loaded from the database at startup and kept synchronized with runtime changes.
 */
@Component
public class SchemeManager {

    private static final Logger LOGGER = Logger.getLogger(SchemeManager.class.getName());
    private final SchemeRepository schemeRepository;

    // Collections: ArrayList for indexed, fast sequential retrieval of all schemes
    private final List<Scheme> schemeList = new ArrayList<>();

    // Collections: HashMap for O(1) constant-time lookup of schemes by ID (as String)
    private final Map<String, Scheme> schemeMap = new HashMap<>();

    // Collections: HashSet to reject duplicate scheme IDs during loading and imports
    private final Set<Integer> schemeIdSet = new HashSet<>();

    // Collections: LinkedHashSet to maintain user-saved schemes in strict insertion order
    private final Set<Integer> savedSchemeOrder = new LinkedHashSet<>();

    // Collections: TreeSet for unique scheme categories in natural alphabetical sort order
    private final Set<String> sortedCategories = new TreeSet<>();

    // Collections: TreeMap for grouping schemes by state in sorted key order
    private final Map<String, List<Scheme>> schemesByState = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

    // Collections: LinkedHashMap with access-order (true) and max size 10 for Recently Viewed Schemes (LRU cache)
    private final Map<Integer, Scheme> recentlyViewed = new LinkedHashMap<Integer, Scheme>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, Scheme> eldest) {
            // Evict oldest accessed entry when size exceeds 10
            return size() > 10;
        }
    };

    // Collections: LinkedList used as a FIFO queue of pending verification tasks
    private final LinkedList<VerificationTask> pendingVerificationQueue = new LinkedList<>();

    // Collections: PriorityQueue ordered by VerificationTask natural priority (highest priority first)
    private final PriorityQueue<VerificationTask> priorityVerificationQueue = new PriorityQueue<>();

    public SchemeManager(SchemeRepository schemeRepository) {
        this.schemeRepository = schemeRepository;
    }

    /**
     * Load initial schemes from database or CSV into collections on application startup
     */
    @PostConstruct
    public synchronized void reloadFromDatabase() {
        List<Scheme> schemesToLoad = new ArrayList<>();
        try {
            List<Scheme> fromDb = schemeRepository.findAll();
            if (fromDb != null && !fromDb.isEmpty()) {
                schemesToLoad.addAll(fromDb);
            }
        } catch (Exception e) {
            LOGGER.warning("Could not query schemes from database: " + e.getMessage());
        }

        if (schemesToLoad.isEmpty()) {
            LOGGER.info("Loading seed schemes into SchemeManager collections from classpath resources (schemes.csv)...");
            schemesToLoad.addAll(loadSeedSchemesFromClasspath());
        }

        clearCollections();
        for (Scheme s : schemesToLoad) {
            addSchemeToCollections(s);
        }
        LOGGER.info("SchemeManager successfully loaded " + schemeList.size() + " schemes into core collections.");
    }

    /**
     * File I/O: Fallback reader loading seed schemes from classpath resources
     */
    private List<Scheme> loadSeedSchemesFromClasspath() {
        List<Scheme> list = new ArrayList<>();
        try {
            org.springframework.core.io.ClassPathResource res = new org.springframework.core.io.ClassPathResource("schemes.csv");
            if (res.exists()) {
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(res.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    int lineNum = 0;
                    while ((line = br.readLine()) != null) {
                        lineNum++;
                        if (lineNum == 1 || line.trim().isEmpty()) continue;
                        List<String> tokens = parseCsvLine(line.trim());
                        if (tokens.size() >= 3) {
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
                            list.add(s);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            LOGGER.warning("Error reading seed schemes.csv from classpath: " + ex.getMessage());
        }
        return list;
    }

    private List<String> parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
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
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens;
    }

    private synchronized void clearCollections() {
        schemeList.clear();
        schemeMap.clear();
        schemeIdSet.clear();
        sortedCategories.clear();
        schemesByState.clear();
    }

    /**
     * Add a single scheme into all collections with duplicate rejection check
     */
    public synchronized boolean addSchemeToCollections(Scheme s) {
        if (s == null || s.getId() == null) return false;

        // Collections: HashSet rejects duplicate scheme IDs
        if (!schemeIdSet.add(s.getId())) {
            LOGGER.fine("HashSet rejected duplicate scheme ID: " + s.getId());
            return false;
        }

        // Collections: ArrayList preserves indexed list
        schemeList.add(s);

        // Collections: HashMap stores lookup by string ID
        schemeMap.put(String.valueOf(s.getId()), s);

        // Collections: TreeSet maintains uniquely sorted categories
        if (s.getCategory() != null) {
            sortedCategories.add(s.getCategory());
        }

        // Collections: TreeMap groups schemes under states in alphabetical order
        String stateKey = (s.getState() != null && !s.getState().isEmpty()) ? s.getState() : "All India";
        schemesByState.computeIfAbsent(stateKey, k -> new ArrayList<>()).add(s);

        return true;
    }

    // Collections: ArrayList getter returning defensive copy
    public synchronized List<Scheme> getAllSchemes() {
        return new ArrayList<>(schemeList);
    }

    // Collections: HashMap O(1) lookup
    public synchronized Scheme getById(String id) {
        Scheme s = schemeMap.get(id);
        if (s != null) {
            recordRecentlyViewed(s);
        }
        return s;
    }

    // Collections: LinkedHashMap access-order recording recently viewed scheme
    public synchronized void recordRecentlyViewed(Scheme s) {
        if (s != null && s.getId() != null) {
            recentlyViewed.put(s.getId(), s);
        }
    }

    // Collections: Returns recently viewed schemes in access order (most recent last or reversed for display)
    public synchronized List<Scheme> getRecentlyViewed() {
        List<Scheme> list = new ArrayList<>(recentlyViewed.values());
        Collections.reverse(list); // Most recently viewed first
        return list;
    }

    // Collections: LinkedHashSet tracking saved schemes in insertion order
    public synchronized void recordSavedScheme(int schemeId) {
        savedSchemeOrder.add(schemeId);
    }

    public synchronized void removeSavedScheme(int schemeId) {
        savedSchemeOrder.remove(schemeId);
    }

    public synchronized Set<Integer> getSavedSchemeOrder() {
        return new LinkedHashSet<>(savedSchemeOrder);
    }

    // Collections: TreeSet unique categories in sorted order
    public synchronized Set<String> getSortedCategories() {
        return new TreeSet<>(sortedCategories);
    }

    // Collections: TreeMap schemes grouped by state
    public synchronized Map<String, List<Scheme>> getSchemesGroupedByState() {
        Map<String, List<Scheme>> copy = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (Map.Entry<String, List<Scheme>> entry : schemesByState.entrySet()) {
            copy.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        return copy;
    }

    // Collections: LinkedList FIFO queue for verification tasks
    public synchronized void enqueueVerificationTask(VerificationTask task) {
        pendingVerificationQueue.addLast(task); // LinkedList FIFO
        priorityVerificationQueue.add(task);    // PriorityQueue sorted by priority
    }

    public synchronized VerificationTask dequeueNextVerificationTask() {
        return pendingVerificationQueue.pollFirst();
    }

    public synchronized VerificationTask pollHighestPriorityTask() {
        return priorityVerificationQueue.poll();
    }

    public synchronized List<VerificationTask> getPendingVerificationTasks() {
        return new ArrayList<>(pendingVerificationQueue);
    }

    /**
     * Search schemes across name, category, and description using Iterator
     * Demonstrates Iterator traversal.
     */
    public synchronized List<Scheme> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllSchemes();
        }
        String q = query.trim().toLowerCase();
        List<Scheme> results = new ArrayList<>();

        // Collections: Iterator for traversing schemeList
        Iterator<Scheme> iterator = schemeList.iterator();
        while (iterator.hasNext()) {
            Scheme s = iterator.next();
            boolean match = (s.getName() != null && s.getName().toLowerCase().contains(q))
                    || (s.getCategory() != null && s.getCategory().toLowerCase().contains(q))
                    || (s.getDescription() != null && s.getDescription().toLowerCase().contains(q))
                    || (s.getState() != null && s.getState().toLowerCase().contains(q));
            if (match) {
                results.add(s);
            }
        }
        return results;
    }

    /**
     * Sort schemes by property (name, state, category, priority)
     */
    public synchronized List<Scheme> getSortedSchemes(String sortBy) {
        List<Scheme> list = new ArrayList<>(schemeList);
        if (sortBy == null) return list;

        switch (sortBy.toLowerCase()) {
            case "name":
                Collections.sort(list); // Comparable natural ordering
                break;
            case "state":
                list.sort(Scheme.BY_STATE); // Comparator by state
                break;
            case "category":
                list.sort(Scheme.BY_CATEGORY); // Comparator by category
                break;
            case "priority":
            case "match":
                list.sort(Scheme.BY_PRIORITY); // Comparator by match/priority
                break;
            default:
                Collections.sort(list);
                break;
        }
        return list;
    }

    /**
     * Filter schemes by state and category using ListIterator
     * Demonstrates ListIterator bidirectional traversal capability.
     */
    public synchronized List<Scheme> filterSchemes(String state, String category) {
        List<Scheme> filtered = new ArrayList<>(schemeList);

        // Collections: ListIterator for bidirectional traversal and in-place safe removal
        ListIterator<Scheme> listIterator = filtered.listIterator();
        while (listIterator.hasNext()) {
            Scheme s = listIterator.next();
            boolean keep = true;

            if (state != null && !state.trim().isEmpty() && !state.equalsIgnoreCase("All States") && !state.equalsIgnoreCase("All India")) {
                String sState = s.getState() != null ? s.getState() : "All India";
                boolean stateMatch = sState.equalsIgnoreCase("All India")
                        || sState.equalsIgnoreCase("State dependent")
                        || sState.equalsIgnoreCase("Participating states")
                        || sState.equalsIgnoreCase(state.trim());
                if (!stateMatch) keep = false;
            }

            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All categories") && !category.equalsIgnoreCase("All")) {
                if (s.getCategory() == null || !s.getCategory().equalsIgnoreCase(category.trim())) {
                    keep = false;
                }
            }

            if (!keep) {
                // Collections: ListIterator safe removal during iteration
                listIterator.remove();
            }
        }
        return filtered;
    }
}
