
package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.entity.FoodRequest;

@Repository
public interface FoodRequestRepository
        extends JpaRepository<FoodRequest, Long> {

    boolean existsByDonationIdAndReceiverId(
            Long donationId, Long receiverId);

    List<FoodRequest> findByReceiverId(Long receiverId);

    List<FoodRequest> findByDonationDonorId(Long donorId);

    List<FoodRequest> findByDonation_IdAndStatus(
            Long donationId, String status);
}
