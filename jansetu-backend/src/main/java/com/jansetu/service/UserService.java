package com.jansetu.service;

import com.jansetu.collections.SchemeManager;
import com.jansetu.model.Scheme;
import com.jansetu.model.User;
import com.jansetu.repository.SavedSchemeRepository;
import com.jansetu.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UserService coordinating user account and profile operations
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final SavedSchemeRepository savedSchemeRepository;
    private final SchemeManager schemeManager;

    // Collections: Fallback ConcurrentHashMap for graceful operation if database connection is pending
    private final java.util.Map<Integer, User> memoryUserMap = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<Integer, java.util.Set<Integer>> memorySavedMap = new java.util.concurrent.ConcurrentHashMap<>();

    public UserService(UserRepository userRepository,
                       SavedSchemeRepository savedSchemeRepository,
                       SchemeManager schemeManager) {
        this.userRepository = userRepository;
        this.savedSchemeRepository = savedSchemeRepository;
        this.schemeManager = schemeManager;

        // Seed default demo user in memory fallback
        User demo = new User(1, "Aarav Sharma", "aarav@jansetu.in", "Punjab", "Student");
        demo.setPassword("password123");
        demo.setAge(20);
        demo.setAnnualIncome("₹2.5–5 lakh");
        demo.setEducation("Undergraduate");
        memoryUserMap.put(1, demo);
        memorySavedMap.computeIfAbsent(1, k -> new java.util.LinkedHashSet<>()).add(2);
    }

    public User createUser(User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        user.setEmail(user.getEmail().trim().toLowerCase());

        try {
            Optional<User> existing = userRepository.findByEmail(user.getEmail());
            if (existing.isPresent()) {
                throw new IllegalArgumentException("User already exists with email: " + user.getEmail());
            }
            User saved = userRepository.save(user);
            memoryUserMap.put(saved.getId(), saved);
            return saved;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            int newId = memoryUserMap.size() + 1;
            user.setId(newId);
            memoryUserMap.put(newId, user);
            return user;
        }
    }

    public Optional<User> getUserById(Integer id) {
        try {
            Optional<User> fromDb = userRepository.findById(id);
            if (fromDb.isPresent()) return fromDb;
        } catch (Exception ignored) {}
        return Optional.ofNullable(memoryUserMap.get(id));
    }

    public Optional<User> getUserByEmail(String email) {
        if (email == null) return Optional.empty();
        String em = email.trim().toLowerCase();
        try {
            Optional<User> fromDb = userRepository.findByEmail(em);
            if (fromDb.isPresent()) return fromDb;
        } catch (Exception ignored) {}
        return memoryUserMap.values().stream()
                .filter(u -> em.equalsIgnoreCase(u.getEmail()))
                .findFirst();
    }

    /**
     * Authenticates a user by email and password.
     */
    public Optional<User> authenticate(String email, String password) {
        if (email == null || password == null) return Optional.empty();
        Optional<User> userOpt = getUserByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword() != null && user.getPassword().equals(password)) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public List<User> getAllUsers() {
        try {
            List<User> list = userRepository.findAll();
            if (!list.isEmpty()) return list;
        } catch (Exception ignored) {}
        return new ArrayList<>(memoryUserMap.values());
    }

    public User updateUser(Integer id, User user) {
        user.setId(id);
        memoryUserMap.put(id, user);
        try {
            return userRepository.update(user);
        } catch (Exception ignored) {}
        return user;
    }

    public boolean deleteUser(Integer id) {
        memoryUserMap.remove(id);
        try {
            return userRepository.deleteById(id);
        } catch (Exception ignored) {}
        return true;
    }

    public List<Scheme> getSavedSchemes(Integer userId) {
        try {
            List<Scheme> list = savedSchemeRepository.findSchemesByUserId(userId);
            if (!list.isEmpty()) return list;
        } catch (Exception ignored) {}

        java.util.Set<Integer> ids = memorySavedMap.getOrDefault(userId, java.util.Collections.emptySet());
        List<Scheme> result = new ArrayList<>();
        for (Integer sid : ids) {
            Scheme s = schemeManager.getById(String.valueOf(sid));
            if (s != null) result.add(s);
        }
        return result;
    }

    public boolean saveScheme(Integer userId, Integer schemeId) {
        memorySavedMap.computeIfAbsent(userId, k -> new java.util.LinkedHashSet<>()).add(schemeId);
        schemeManager.recordSavedScheme(schemeId);
        try {
            savedSchemeRepository.save(userId, schemeId);
        } catch (Exception ignored) {}
        return true;
    }

    public boolean removeSavedScheme(Integer userId, Integer schemeId) {
        java.util.Set<Integer> set = memorySavedMap.get(userId);
        if (set != null) {
            set.remove(schemeId);
        }
        schemeManager.removeSavedScheme(schemeId);
        try {
            savedSchemeRepository.remove(userId, schemeId);
        } catch (Exception ignored) {}
        return true;
    }
}
