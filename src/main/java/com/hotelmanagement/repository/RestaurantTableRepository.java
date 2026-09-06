package com.hotelmanagement.repository;

import com.hotelmanagement.model.DiningArea;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByStatus(TableStatus status);
    List<RestaurantTable> findByArea(DiningArea area);
}
