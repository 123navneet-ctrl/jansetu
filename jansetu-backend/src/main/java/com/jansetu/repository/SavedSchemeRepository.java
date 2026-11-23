package com.jansetu.repository;

import com.jansetu.model.SavedScheme;
import com.jansetu.model.Scheme;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * SavedSchemeRepository managing user's bookmarked schemes via JDBC
 */
@Repository
public class SavedSchemeRepository {

    private static final Logger LOGGER = Logger.getLogger(SavedSchemeRepository.class.getName());
    private final DataSource dataSource;

    public SavedSchemeRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // JDBC: Save association between user and scheme
    public SavedScheme save(Integer userId, Integer schemeId) {
        String sql = "INSERT INTO saved_schemes (user_id, scheme_id) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE scheme_id=VALUES(scheme_id)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, userId);
            stmt.setInt(2, schemeId);
            stmt.executeUpdate();

            SavedScheme saved = new SavedScheme(userId, schemeId);
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    saved.setId(keys.getInt(1));
                }
            }
            return saved;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error saving scheme for user via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error saving bookmark: " + e.getMessage(), e);
        }
    }

    // JDBC: Remove saved scheme for user
    public boolean remove(Integer userId, Integer schemeId) {
        String sql = "DELETE FROM saved_schemes WHERE user_id = ? AND scheme_id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);
            stmt.setInt(2, schemeId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error removing saved scheme via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error removing bookmark: " + e.getMessage(), e);
        }
    }

    // JDBC: List all saved schemes for a given user with joined scheme data
    public List<Scheme> findSchemesByUserId(Integer userId) {
        String sql = "SELECT s.* FROM schemes s " +
                "INNER JOIN saved_schemes ss ON s.id = ss.scheme_id " +
                "WHERE ss.user_id = ? ORDER BY ss.saved_at DESC";

        List<Scheme> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Scheme s = new Scheme();
                    s.setId(rs.getInt("id"));
                    s.setName(rs.getString("name"));
                    s.setCategory(rs.getString("category"));
                    s.setIcon(rs.getString("icon"));
                    s.setColor(rs.getString("color"));
                    s.setMatch(rs.getInt("match_score"));
                    s.setDescription(rs.getString("description"));
                    s.setBenefit(rs.getString("benefit"));
                    s.setDeadline(rs.getString("deadline"));
                    s.setState(rs.getString("state"));
                    s.setTag(rs.getString("tag"));
                    s.setEligibility(rs.getString("eligibility"));
                    s.setDocuments(rs.getString("documents"));
                    s.setHowToApply(rs.getString("how_to_apply"));
                    s.setApplicationLink(rs.getString("application_link"));
                    s.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(s);
                }
            }
            return list;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error fetching saved schemes for user via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error loading saved schemes: " + e.getMessage(), e);
        }
    }

    // JDBC: Check if user has saved a scheme
    public boolean isSaved(Integer userId, Integer schemeId) {
        String sql = "SELECT 1 FROM saved_schemes WHERE user_id = ? AND scheme_id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);
            stmt.setInt(2, schemeId);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error checking saved scheme status via JDBC: " + e.getMessage(), e);
            return false;
        }
    }
}

