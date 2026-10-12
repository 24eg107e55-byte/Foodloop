package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.FoodDonation;

@Repository
public interface FoodDonationRepository
        extends JpaRepository<FoodDonation, Long> {

    // Get donations by status
    List<FoodDonation> findByStatus(String status);

    // Search donations by location
    List<FoodDonation> findByLocationContainingIgnoreCase(String location);

    // Get donations belonging to a specific donor
    List<FoodDonation> findByDonorId(Long donorId);
}