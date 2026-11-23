package com.jansetu.repository;

import com.jansetu.model.Scheme;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * SchemeRepository implementing GenericRepository<Scheme, Integer> with hand-written JDBC.
 */
@Repository
public class SchemeRepository implements GenericRepository<Scheme, Integer> {

    private static final Logger LOGGER = Logger.getLogger(SchemeRepository.class.getName());
    private final DataSource dataSource;

    public SchemeRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // JDBC: Hand-written PreparedStatement insert / replace into schemes table
    @Override
    public Scheme save(Scheme scheme) {
        String sql = "INSERT INTO schemes (id, name, category, icon, color, match_score, description, " +
                "benefit, deadline, state, tag, eligibility, documents, how_to_apply, application_link) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), match_score=VALUES(match_score), " +
                "description=VALUES(description), benefit=VALUES(benefit), state=VALUES(state)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, scheme.getId());
            stmt.setString(2, scheme.getName());
            stmt.setString(3, scheme.getCategory());
            stmt.setString(4, scheme.getIcon() != null ? scheme.getIcon() : "✦");
            stmt.setString(5, scheme.getColor() != null ? scheme.getColor() : "blue");
            stmt.setInt(6, scheme.getMatch() != null ? scheme.getMatch() : 75);
            stmt.setString(7, scheme.getDescription());
            stmt.setString(8, scheme.getBenefit());
            stmt.setString(9, scheme.getDeadline() != null ? scheme.getDeadline() : "Open year-round");
            stmt.setString(10, scheme.getState() != null ? scheme.getState() : "All India");
            stmt.setString(11, scheme.getTag() != null ? scheme.getTag() : "General");
            stmt.setString(12, scheme.getEligibility());
            stmt.setString(13, scheme.getDocuments());
            stmt.setString(14, scheme.getHowToApply());
            stmt.setString(15, scheme.getApplicationLink());

            stmt.executeUpdate();
            return scheme;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error inserting scheme via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error saving scheme: " + e.getMessage(), e);
        }
    }

    // JDBC: Batch insert for efficient CSV imports
    public int saveAll(List<Scheme> schemes) {
        String sql = "INSERT INTO schemes (id, name, category, icon, color, match_score, description, " +
                "benefit, deadline, state, tag, eligibility, documents, how_to_apply, application_link) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), match_score=VALUES(match_score), " +
                "description=VALUES(description), benefit=VALUES(benefit), state=VALUES(state)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            conn.setAutoCommit(false);
            for (Scheme scheme : schemes) {
                stmt.setInt(1, scheme.getId());
                stmt.setString(2, scheme.getName());
                stmt.setString(3, scheme.getCategory());
                stmt.setString(4, scheme.getIcon() != null ? scheme.getIcon() : "✦");
                stmt.setString(5, scheme.getColor() != null ? scheme.getColor() : "blue");
                stmt.setInt(6, scheme.getMatch() != null ? scheme.getMatch() : 75);
                stmt.setString(7, scheme.getDescription());
                stmt.setString(8, scheme.getBenefit());
                stmt.setString(9, scheme.getDeadline() != null ? scheme.getDeadline() : "Open year-round");
                stmt.setString(10, scheme.getState() != null ? scheme.getState() : "All India");
                stmt.setString(11, scheme.getTag() != null ? scheme.getTag() : "General");
                stmt.setString(12, scheme.getEligibility());
                stmt.setString(13, scheme.getDocuments());
                stmt.setString(14, scheme.getHowToApply());
                stmt.setString(15, scheme.getApplicationLink());
                stmt.addBatch();
            }
            int[] results = stmt.executeBatch();
            conn.commit();
            return results.length;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error in batch saving schemes via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database batch insert error: " + e.getMessage(), e);
        }
    }

    // JDBC: findById with PreparedStatement and ResultSet mapping
    @Override
    public Optional<Scheme> findById(Integer id) {
        String sql = "SELECT * FROM schemes WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToScheme(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding scheme by ID via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error finding scheme: " + e.getMessage(), e);
        }
    }

    // JDBC: findAll with while(rs.next())
    @Override
    public List<Scheme> findAll() {
        String sql = "SELECT * FROM schemes ORDER BY id ASC";
        List<Scheme> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToScheme(rs));
            }
            return list;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error fetching all schemes via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error loading schemes: " + e.getMessage(), e);
        }
    }

    // JDBC: Filtering with PreparedStatement
    public List<Scheme> findByStateAndCategory(String state, String category) {
        StringBuilder sql = new StringBuilder("SELECT * FROM schemes WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (state != null && !state.trim().isEmpty() && !state.equalsIgnoreCase("All States") && !state.equalsIgnoreCase("All India")) {
            sql.append(" AND (state = ? OR state = 'All India' OR state = 'State dependent' OR state = 'Participating states')");
            params.add(state.trim());
        }
        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All categories") && !category.equalsIgnoreCase("All")) {
            sql.append(" AND category = ?");
            params.add(category.trim());
        }
        sql.append(" ORDER BY id ASC");

        List<Scheme> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToScheme(rs));
                }
            }
            return list;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error filtering schemes via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error filtering schemes: " + e.getMessage(), e);
        }
    }

    // JDBC: update scheme record
    @Override
    public Scheme update(Scheme scheme) {
        String sql = "UPDATE schemes SET name=?, category=?, icon=?, color=?, match_score=?, description=?, " +
                "benefit=?, deadline=?, state=?, tag=?, eligibility=?, documents=?, how_to_apply=?, application_link=? WHERE id=?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, scheme.getName());
            stmt.setString(2, scheme.getCategory());
            stmt.setString(3, scheme.getIcon());
            stmt.setString(4, scheme.getColor());
            stmt.setInt(5, scheme.getMatch() != null ? scheme.getMatch() : 70);
            stmt.setString(6, scheme.getDescription());
            stmt.setString(7, scheme.getBenefit());
            stmt.setString(8, scheme.getDeadline());
            stmt.setString(9, scheme.getState());
            stmt.setString(10, scheme.getTag());
            stmt.setString(11, scheme.getEligibility());
            stmt.setString(12, scheme.getDocuments());
            stmt.setString(13, scheme.getHowToApply());
            stmt.setString(14, scheme.getApplicationLink());
            stmt.setInt(15, scheme.getId());

            int updated = stmt.executeUpdate();
            if (updated == 0) {
                throw new RuntimeException("Scheme not found with ID: " + scheme.getId());
            }
            return scheme;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating scheme via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error updating scheme: " + e.getMessage(), e);
        }
    }

    // JDBC: deleteById
    @Override
    public boolean deleteById(Integer id) {
        String sql = "DELETE FROM schemes WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting scheme via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error deleting scheme: " + e.getMessage(), e);
        }
    }

    // JDBC: Mapping ResultSet to Scheme domain model
    private Scheme mapRowToScheme(ResultSet rs) throws SQLException {
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
        return s;
    }
}

