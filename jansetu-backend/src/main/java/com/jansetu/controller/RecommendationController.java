package com.jansetu.controller;

import com.jansetu.model.User;
import com.jansetu.service.RecommendationService;
import com.jansetu.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * REST API Controller for Scheme Recommendations using Streams API
 */
@RestController
@RequestMapping("/api/users")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    public RecommendationController(RecommendationService recommendationService, UserService userService) {
        this.recommendationService = recommendationService;
        this.userService = userService;
    }

    /**
     * Streams API Recommendations endpoint
     */
    @GetMapping("/{id}/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "priority") String sort) {

        Optional<User> userOpt = userService.getUserById(id);
        User user = userOpt.orElseGet(() -> {
            // Default demo profile if user id not yet created in DB
            User defaultUser = new User();
            defaultUser.setId(id);
            defaultUser.setName("Guest User");
            defaultUser.setState("Punjab");
            defaultUser.setAge(20);
            defaultUser.setOccupation("Student");
            defaultUser.setAnnualIncome("₹2.5–5 lakh");
            return defaultUser;
        });

        Map<String, Object> recommendations = recommendationService.recommend(user, page, size, sort);
        return ResponseEntity.ok(recommendations);
    }
}

