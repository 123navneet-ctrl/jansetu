package com.jansetu.repository;

import java.util.List;
import java.util.Optional;

/**
 * Generics: GenericRepository<T, ID>
 * Parameterized generic interface defining type-safe CRUD operations.
 *
 * @param <T>  The entity type
 * @param <ID> The primary key identifier type
 */
public interface GenericRepository<T, ID> {

    // Generics: Type-safe save returning the entity
    T save(T entity);

    // Generics: Optional<T> container for nullable lookup results
    Optional<T> findById(ID id);

    // Generics: List<T> collection of entities
    List<T> findAll();

    // Generics: Type-safe update
    T update(T entity);

    // Generics: Delete operation by ID
    boolean deleteById(ID id);
}

