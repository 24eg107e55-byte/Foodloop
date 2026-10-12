
package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.FoodDonation;
import com.example.demo.entity.User;
import com.example.demo.repository.FoodDonationRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/donations")
public class FoodDonationController {

    private final FoodDonationRepository donationRepository;
    private final UserRepository userRepository;

    public FoodDonationController(
            FoodDonationRepository donationRepository,
            UserRepository userRepository) {
        this.donationRepository = donationRepository;
        this.userRepository = userRepository;
    }

    // Create a donation - only DONOR role
    @PostMapping
    public ResponseEntity<?> createDonation(
            @RequestBody FoodDonation donation) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first");
        }

        User donor = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (donor == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found. Please log in again.");
        }

        if (!"DONOR".equalsIgnoreCase(donor.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only donors can create donations");
        }

        donation.setDonor(donor);
        donation.setStatus("AVAILABLE");

        FoodDonation savedDonation =
                donationRepository.save(donation);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedDonation);
    }

    // Get all donations
    @GetMapping
    public List<FoodDonation> getAllDonations() {
        return donationRepository.findAll();
    }

    // Get available donations only
    @GetMapping("/available")
    public List<FoodDonation> getAvailableDonations() {
        return donationRepository.findByStatus("AVAILABLE");
    }

    // Get donations belonging to the logged-in donor
    @GetMapping("/my-donations")
    public ResponseEntity<?> getMyDonations() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first");
        }

        User donor = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (donor == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found. Please log in again.");
        }

        if (!"DONOR".equalsIgnoreCase(donor.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only donors can view their donations");
        }

        return ResponseEntity.ok(
                donationRepository.findByDonorId(donor.getId())
        );
    }

    // Get donations by location
    @GetMapping("/location/{location}")
    public List<FoodDonation> getDonationsByLocation(
            @PathVariable String location) {

        return donationRepository
                .findByLocationContainingIgnoreCase(location);
    }

    // Get donation by ID
    @GetMapping("/{id}")
    public ResponseEntity<FoodDonation> getDonationById(
            @PathVariable Long id) {

        return donationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
