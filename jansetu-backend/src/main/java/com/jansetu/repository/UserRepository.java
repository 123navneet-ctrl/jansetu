package com.jansetu.repository;

import com.jansetu.model.User;
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
 * UserRepository implementing GenericRepository<User, Integer> with pure hand-written JDBC.
 * Never concatenates user input; uses PreparedStatement parameter binding for all queries.
 */
@Repository
public class UserRepository implements GenericRepository<User, Integer> {

    private static final Logger LOGGER = Logger.getLogger(UserRepository.class.getName());
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // JDBC: Hand-written PreparedStatement with RETURN_GENERATED_KEYS and try-with-resources
    @Override
    public User save(User user) {
        String sql = "INSERT INTO users (name, email, password, age, state, occupation, annual_income, " +
                "education, gender, category, disability, marital_status, area_type, minority, phone, district, notes) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            // JDBC: Parameter binding avoiding SQL injection
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPassword() != null ? user.getPassword() : "");
            stmt.setObject(4, user.getAge());
            stmt.setString(5, user.getState());
            stmt.setString(6, user.getOccupation());
            stmt.setString(7, user.getAnnualIncome());
            stmt.setString(8, user.getEducation());
            stmt.setString(9, user.getGender());
            stmt.setString(10, user.getCategory());
            stmt.setString(11, user.getDisability());
            stmt.setString(12, user.getMaritalStatus());
            stmt.setString(13, user.getAreaType());
            stmt.setString(14, user.getMinority());
            stmt.setString(15, user.getPhone());
            stmt.setString(16, user.getDistrict());
            stmt.setString(17, user.getNotes());

            // JDBC: executeUpdate
            int affected = stmt.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = stmt.getGeneratedKeys()) {
                    if (keys.next()) {
                        user.setId(keys.getInt(1));
                    }
                }
            }
            return user;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error inserting user via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error saving user: " + e.getMessage(), e);
        }
    }

    // JDBC: PreparedStatement and executeQuery with ResultSet mapping
    @Override
    public Optional<User> findById(Integer id) {
        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error querying user by ID via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error finding user: " + e.getMessage(), e);
        }
    }

    // JDBC: Query by email with PreparedStatement
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error querying user by email via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error finding user by email: " + e.getMessage(), e);
        }
    }

    // JDBC: executeQuery with while (rs.next())
    @Override
    public List<User> findAll() {
        String sql = "SELECT * FROM users ORDER BY id ASC";
        List<User> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRowToUser(rs));
            }
            return list;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error querying all users via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error fetching users: " + e.getMessage(), e);
        }
    }

    // JDBC: executeUpdate for updating user record
    @Override
    public User update(User user) {
        String sql = "UPDATE users SET name=?, age=?, state=?, occupation=?, annual_income=?, education=?, " +
                "gender=?, category=?, disability=?, marital_status=?, area_type=?, minority=?, phone=?, " +
                "district=?, notes=? WHERE id=?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.getName());
            stmt.setObject(2, user.getAge());
            stmt.setString(3, user.getState());
            stmt.setString(4, user.getOccupation());
            stmt.setString(5, user.getAnnualIncome());
            stmt.setString(6, user.getEducation());
            stmt.setString(7, user.getGender());
            stmt.setString(8, user.getCategory());
            stmt.setString(9, user.getDisability());
            stmt.setString(10, user.getMaritalStatus());
            stmt.setString(11, user.getAreaType());
            stmt.setString(12, user.getMinority());
            stmt.setString(13, user.getPhone());
            stmt.setString(14, user.getDistrict());
            stmt.setString(15, user.getNotes());
            stmt.setInt(16, user.getId());

            int updated = stmt.executeUpdate();
            if (updated == 0) {
                throw new RuntimeException("User not found with ID: " + user.getId());
            }
            return user;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating user via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error updating user: " + e.getMessage(), e);
        }
    }

    // JDBC: executeUpdate for deleting user record
    @Override
    public boolean deleteById(Integer id) {
        String sql = "DELETE FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting user via JDBC: " + e.getMessage(), e);
            throw new RuntimeException("Database error deleting user: " + e.getMessage(), e);
        }
    }

    // JDBC: Mapping ResultSet to User domain model
    private User mapRowToUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getInt("id"));
        u.setName(rs.getString("name"));
        u.setEmail(rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setAge(rs.getInt("age"));
        u.setState(rs.getString("state"));
        u.setOccupation(rs.getString("occupation"));
        u.setAnnualIncome(rs.getString("annual_income"));
        u.setEducation(rs.getString("education"));
        u.setGender(rs.getString("gender"));
        u.setCategory(rs.getString("category"));
        u.setDisability(rs.getString("disability"));
        u.setMaritalStatus(rs.getString("marital_status"));
        u.setAreaType(rs.getString("area_type"));
        u.setMinority(rs.getString("minority"));
        u.setPhone(rs.getString("phone"));
        u.setDistrict(rs.getString("district"));
        u.setNotes(rs.getString("notes"));
        u.setCreatedAt(rs.getTimestamp("created_at"));
        u.setUpdatedAt(rs.getTimestamp("updated_at"));
        return u;
    }
}

