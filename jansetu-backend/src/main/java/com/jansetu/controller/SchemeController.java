package com.jansetu.controller;

import com.jansetu.model.Scheme;
import com.jansetu.service.SchemeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST API Controller for Government Welfare Schemes and Collections Endpoints
 */
@RestController
@RequestMapping("/api/schemes")
public class SchemeController {

    private final SchemeService schemeService;

    public SchemeController(SchemeService schemeService) {
        this.schemeService = schemeService;
    }

    @GetMapping
    public ResponseEntity<List<Scheme>> getAllSchemes() {
        return ResponseEntity.ok(schemeService.getAllSchemes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Scheme> getSchemeById(@PathVariable String id) {
        return schemeService.getSchemeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Scheme> createScheme(@RequestBody Scheme scheme) {
        Scheme created = schemeService.createScheme(scheme);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Scheme> updateScheme(@PathVariable Integer id, @RequestBody Scheme scheme) {
        Scheme updated = schemeService.updateScheme(id, scheme);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScheme(@PathVariable Integer id) {
        boolean deleted = schemeService.deleteScheme(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // Collections: Search using Iterator
    @GetMapping("/search")
    public ResponseEntity<List<Scheme>> searchSchemes(@RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(schemeService.search(q));
    }

    // Collections: Sort using Comparable and Comparators (by name, state, category, priority)
    @GetMapping("/sort")
    public ResponseEntity<List<Scheme>> sortSchemes(@RequestParam(required = false, defaultValue = "priority") String by) {
        return ResponseEntity.ok(schemeService.sort(by));
    }

    // Collections: Filter using ListIterator bidirectional traversal and in-place removal
    @GetMapping("/filter")
    public ResponseEntity<List<Scheme>> filterSchemes(@RequestParam(required = false) String state,
                                                      @RequestParam(required = false) String category) {
        return ResponseEntity.ok(schemeService.filter(state, category));
    }

    // Collections: TreeSet uniquely sorted categories
    @GetMapping("/categories")
    public ResponseEntity<Set<String>> getCategories() {
        return ResponseEntity.ok(schemeService.getCategories());
    }

    // Collections: LinkedHashMap access-order LRU cache of recently viewed schemes
    @GetMapping("/recently-viewed")
    public ResponseEntity<List<Scheme>> getRecentlyViewed() {
        return ResponseEntity.ok(schemeService.getRecentlyViewed());
    }

    // Collections: TreeMap schemes grouped by state in natural sort order
    @GetMapping("/grouped-by-state")
    public ResponseEntity<Map<String, List<Scheme>>> getSchemesGroupedByState() {
        return ResponseEntity.ok(schemeService.getGroupedByState());
    }
}

