package com.jansetu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import jakarta.annotation.PostConstruct;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * JDBC Database Configuration
 * Hand-written JDBC connection manager without Spring Data or JPA.
 */
@Configuration
public class DatabaseConfig {

    private static final Logger LOGGER = Logger.getLogger(DatabaseConfig.class.getName());

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    // JDBC: Creating custom DataSource bean for hand-written JDBC connections
    @Bean
    public DataSource dataSource() {
        try {
            Class.forName(driverClassName);
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "MySQL JDBC Driver not found on classpath", e);
        }

        // Return a standard DataSource implementation
        return new DataSource() {
            @Override
            public Connection getConnection() throws SQLException {
                // JDBC: DriverManager.getConnection with credentials
                return DriverManager.getConnection(dbUrl, dbUsername, dbPassword);
            }

            @Override
            public Connection getConnection(String username, String password) throws SQLException {
                return DriverManager.getConnection(dbUrl, username, password);
            }

            @Override
            public <T> T unwrap(Class<T> iface) throws SQLException {
                throw new SQLException("Unwrap not supported");
            }

            @Override
            public boolean isWrapperFor(Class<?> iface) {
                return false;
            }

            @Override
            public java.io.PrintWriter getLogWriter() {
                return null;
            }

            @Override
            public void setLogWriter(java.io.PrintWriter out) {}

            @Override
            public void setLoginTimeout(int seconds) {}

            @Override
            public int getLoginTimeout() {
                return 0;
            }

            @Override
            public Logger getParentLogger() {
                return LOGGER;
            }
        };
    }

    @PostConstruct
    public void onStartup() {
        try {
            initializeSchemaIfPossible(dataSource());
        } catch (Exception e) {
            LOGGER.fine("Startup schema check notice: " + e.getMessage());
        }
    }

    /**
     * Optional auto-initialization of schema.sql on application startup
     * Uses hand-written JDBC try-with-resources.
     */
    public boolean initializeSchemaIfPossible(DataSource dataSource) {
        // JDBC: try-with-resources ensuring Connection and Statement closure
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            ClassPathResource resource = new ClassPathResource("schema.sql");
            if (!resource.exists()) {
                LOGGER.info("schema.sql not found in resources, skipping auto-init");
                return false;
            }

            StringBuilder sqlBuilder = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("--") || trimmed.isEmpty()) {
                        continue;
                    }
                    sqlBuilder.append(line).append("\n");
                    if (trimmed.endsWith(";")) {
                        String singleSql = sqlBuilder.toString().trim();
                        // Remove trailing semicolon for JDBC statement
                        singleSql = singleSql.substring(0, singleSql.length() - 1);
                        try {
                            stmt.execute(singleSql);
                        } catch (SQLException ex) {
                            // If table already exists or minor notice, keep executing
                            LOGGER.log(Level.FINE, "SQL statement execution: " + ex.getMessage());
                        }
                        sqlBuilder.setLength(0);
                    }
                }
            }
            LOGGER.info("JanSetu schema.sql auto-initialization check completed.");
            return true;
        } catch (SQLException e) {
            LOGGER.log(Level.WARNING, "MySQL connection not available during startup schema check: " + e.getMessage()
                    + ". The application will start; please ensure MySQL is running and credentials in application.properties are valid.");
            return false;
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Error reading schema.sql: " + e.getMessage());
            return false;
        }
    }
}

