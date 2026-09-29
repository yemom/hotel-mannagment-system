package com.hotelmanagement.repository;

import com.hotelmanagement.model.SpaCategory;
import com.hotelmanagement.model.SpaService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpaServiceRepository extends JpaRepository<SpaService, Long> {

    List<SpaService> findByActiveTrue();

    List<SpaService> findByCategoryAndActiveTrue(SpaCategory category);

    Optional<SpaService> findByName(String name);

    List<SpaService> findByCategory(SpaCategory category);
}
