package com.jansetu.controller;

import com.jansetu.model.Scheme;
import com.jansetu.model.User;
import com.jansetu.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for User Profile and Saved Schemes Management
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials != null ? credentials.get("email") : null;
        String password = credentials != null ? credentials.get("password") : null;

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "MISSING_FIELDS",
                "message", "Email and password are required."
            ));
        }

        String normalizedEmail = email.trim().toLowerCase();
        java.util.Optional<User> userOpt = userService.getUserByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "USER_NOT_FOUND",
                "message", "No account found with email: " + normalizedEmail + ". Please sign up first."
            ));
        }

        User user = userOpt.get();
        if (user.getPassword() == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "INVALID_PASSWORD",
                "message", "Incorrect password. Please check your password and try again."
            ));
        }

        // Return authenticated safe user record
        User safeUser = new User();
        safeUser.setId(user.getId());
        safeUser.setName(user.getName());
        safeUser.setEmail(user.getEmail());
        safeUser.setAge(user.getAge());
        safeUser.setState(user.getState());
        safeUser.setOccupation(user.getOccupation());
        safeUser.setAnnualIncome(user.getAnnualIncome());
        safeUser.setEducation(user.getEducation());
        safeUser.setGender(user.getGender());
        safeUser.setCategory(user.getCategory());
        safeUser.setDisability(user.getDisability());
        safeUser.setMaritalStatus(user.getMaritalStatus());
        safeUser.setAreaType(user.getAreaType());
        safeUser.setMinority(user.getMinority());
        safeUser.setPhone(user.getPhone());
        safeUser.setDistrict(user.getDistrict());
        safeUser.setNotes(user.getNotes());

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Login successful",
            "user", safeUser
        ));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        boolean deleted = userService.deleteUser(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/saved")
    public ResponseEntity<List<Scheme>> getSavedSchemes(@PathVariable Integer id) {
        List<Scheme> list = userService.getSavedSchemes(id);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/saved/{schemeId}")
    public ResponseEntity<Map<String, Object>> saveScheme(@PathVariable Integer id, @PathVariable Integer schemeId) {
        boolean saved = userService.saveScheme(id, schemeId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", saved);
        resp.put("userId", id);
        resp.put("schemeId", schemeId);
        resp.put("message", "Scheme saved to your shortlist");
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @DeleteMapping("/{id}/saved/{schemeId}")
    public ResponseEntity<Map<String, Object>> removeSavedScheme(@PathVariable Integer id, @PathVariable Integer schemeId) {
        boolean removed = userService.removeSavedScheme(id, schemeId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", removed);
        resp.put("userId", id);
        resp.put("schemeId", schemeId);
        resp.put("message", removed ? "Scheme removed from shortlist" : "Scheme was not saved");
        return ResponseEntity.ok(resp);
    }
}

