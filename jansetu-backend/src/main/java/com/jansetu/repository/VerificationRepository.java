package com.jansetu.repository;

import com.jansetu.model.SchemeVerification;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * VerificationRepository managing admin scheme verifications via JDBC.
 */
@Repository
public class VerificationRepository {

    private static final Logger LOGGER = Logger.getLogger(VerificationRepository.class.getName());
    private final DataSource dataSource;

    public VerificationRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // JDBC: Save verification task with generated keys
    public SchemeVerification save(SchemeVerification verif) {
        String sql = "INSERT INTO scheme_verifications (scheme_id, status, priority, notes, verified_by) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, verif.getSchemeId());
            stmt.setString(2, verif.getStatus() != null ? verif.getStatus() : "PENDING");
            stmt.setInt(3, verif.getPriority() != null ? verif.getPriority() : 1);
            stmt.setString(4, verif.getNotes() != null ? verif.getNotes() : "");
            stmt.setString(5, verif.getVerifiedBy() != null ? verif.getVerifiedBy() : "Admin Worker");

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    verif.setId(keys.getInt(1));
                }
            }
            return verif;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error inserting scheme verification via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error saving scheme verification: " + e.getMessage(), e);
        }
    }

    // JDBC: Update status of verification (PENDING -> PROCESSING -> VERIFIED)
    public boolean updateStatus(Integer id, String newStatus) {
        String sql = "UPDATE scheme_verifications SET status = ? WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, newStatus);
            stmt.setInt(2, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating scheme verification status via JDBC: " + e.getMessage(), e);
            return false;
        }
    }

    // JDBC: findById with PreparedStatement
    public Optional<SchemeVerification> findById(Integer id) {
        String sql = "SELECT sv.*, s.name as scheme_name FROM scheme_verifications sv " +
                "LEFT JOIN schemes s ON sv.scheme_id = s.id WHERE sv.id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToVerification(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding scheme verification by ID via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error finding scheme verification: " + e.getMessage(), e);
        }
    }

    // JDBC: findAll with joined scheme name
    public List<SchemeVerification> findAll() {
        String sql = "SELECT sv.*, s.name as scheme_name FROM scheme_verifications sv " +
                "LEFT JOIN schemes s ON sv.scheme_id = s.id ORDER BY sv.created_at DESC";
        List<SchemeVerification> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToVerification(rs));
            }
            return list;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error fetching all scheme verifications via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error fetching scheme verifications: " + e.getMessage(), e);
        }
    }

    private SchemeVerification mapRowToVerification(ResultSet rs) throws SQLException {
        SchemeVerification v = new SchemeVerification();
        v.setId(rs.getInt("id"));
        v.setSchemeId(rs.getInt("scheme_id"));
        v.setStatus(rs.getString("status"));
        v.setPriority(rs.getInt("priority"));
        v.setNotes(rs.getString("notes"));
        v.setVerifiedBy(rs.getString("verified_by"));
        v.setCreatedAt(rs.getTimestamp("created_at"));
        v.setUpdatedAt(rs.getTimestamp("updated_at"));

        try {
            v.setSchemeName(rs.getString("scheme_name"));
        } catch (SQLException ignored) {}

        return v;
    }
}
