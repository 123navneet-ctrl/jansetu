package com.jansetu.service;

import com.jansetu.collections.SchemeManager;
import com.jansetu.model.Scheme;
import com.jansetu.repository.SchemeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * SchemeService orchestrating scheme retrieval, search, filter, and persistence
 */
@Service
public class SchemeService {

    private final SchemeRepository schemeRepository;
    private final SchemeManager schemeManager;

    public SchemeService(SchemeRepository schemeRepository, SchemeManager schemeManager) {
        this.schemeRepository = schemeRepository;
        this.schemeManager = schemeManager;
    }

    public List<Scheme> getAllSchemes() {
        List<Scheme> list = schemeManager.getAllSchemes();
        if (list.isEmpty()) {
            list = schemeRepository.findAll();
            for (Scheme s : list) {
                schemeManager.addSchemeToCollections(s);
            }
        }
        return list;
    }

    public Optional<Scheme> getSchemeById(Integer id) {
        if (id == null) return Optional.empty();
        return getSchemeById(String.valueOf(id));
    }

    public Optional<Scheme> getSchemeById(String idStr) {
        if (idStr == null || idStr.trim().isEmpty()) return Optional.empty();
        Scheme cached = schemeManager.getById(idStr.trim());
        if (cached != null) {
            return Optional.of(cached);
        }
        try {
            Integer numId = Integer.parseInt(idStr.trim());
            Optional<Scheme> fromDb = schemeRepository.findById(numId);
            fromDb.ifPresent(schemeManager::addSchemeToCollections);
            return fromDb;
        } catch (NumberFormatException e) {
            for (Scheme s : schemeManager.getAllSchemes()) {
                if (s.getName() != null && s.getName().equalsIgnoreCase(idStr.replace('-', ' '))) {
                    schemeManager.recordRecentlyViewed(s);
                    return Optional.of(s);
                }
            }
            return Optional.empty();
        }
    }

    public Scheme createScheme(Scheme scheme) {
        if (scheme.getName() == null || scheme.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Scheme name is required");
        }
        if (scheme.getId() == null) {
            // Find max id
            List<Scheme> all = getAllSchemes();
            int maxId = 0;
            for (Scheme s : all) {
                if (s.getId() != null && s.getId() > maxId) {
                    maxId = s.getId();
                }
            }
            scheme.setId(maxId + 1);
        }

        Scheme saved = schemeRepository.save(scheme);
        schemeManager.addSchemeToCollections(saved);
        return saved;
    }

    public Scheme updateScheme(Integer id, Scheme scheme) {
        scheme.setId(id);
        Scheme updated = schemeRepository.update(scheme);
        schemeManager.reloadFromDatabase();
        return updated;
    }

    public boolean deleteScheme(Integer id) {
        boolean deleted = schemeRepository.deleteById(id);
        if (deleted) {
            schemeManager.reloadFromDatabase();
        }
        return deleted;
    }

    public List<Scheme> search(String query) {
        return schemeManager.search(query);
    }

    public List<Scheme> sort(String sortBy) {
        return schemeManager.getSortedSchemes(sortBy);
    }

    public List<Scheme> filter(String state, String category) {
        return schemeManager.filterSchemes(state, category);
    }

    public Set<String> getCategories() {
        return schemeManager.getSortedCategories();
    }

    public List<Scheme> getRecentlyViewed() {
        return schemeManager.getRecentlyViewed();
    }

    public Map<String, List<Scheme>> getGroupedByState() {
        return schemeManager.getSchemesGroupedByState();
    }
}

