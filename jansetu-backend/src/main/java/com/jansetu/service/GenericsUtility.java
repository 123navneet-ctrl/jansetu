package com.jansetu.service;

import java.util.List;

/**
 * Generics Utility demonstrating Bounded Type Parameters
 *
 * Generics: Bounded type parameter <T extends Comparable<T>> restricts T
 * to types that can be mutually compared using compareTo().
 */
public final class GenericsUtility {

    private GenericsUtility() {}

    /**
     * Finds the maximum element in a list of comparable items.
     *
     * @param <T>  A type that implements Comparable<T>
     * @param list The list of elements
     * @return The maximum element, or null if list is null/empty
     */
    // Generics: Bounded-type utility method <T extends Comparable<T>> T max(List<T>)
    public static <T extends Comparable<T>> T max(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }

        T maxElement = list.get(0);
        for (T item : list) {
            if (item != null && (maxElement == null || item.compareTo(maxElement) > 0)) {
                maxElement = item;
            }
        }
        return maxElement;
    }

    /**
     * Finds the minimum element in a list of comparable items.
     */
    public static <T extends Comparable<T>> T min(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }

        T minElement = list.get(0);
        for (T item : list) {
            if (item != null && (minElement == null || item.compareTo(minElement) < 0)) {
                minElement = item;
            }
        }
        return minElement;
    }
}

