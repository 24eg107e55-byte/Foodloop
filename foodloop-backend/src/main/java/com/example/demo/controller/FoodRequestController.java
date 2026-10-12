
package com.example.demo.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.FoodDonation;
import com.example.demo.entity.FoodRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.FoodDonationRepository;
import com.example.demo.repository.FoodRequestRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/food-requests")
public class FoodRequestController {

    private final FoodRequestRepository requestRepository;
    private final FoodDonationRepository donationRepository;
    private final UserRepository userRepository;

    public FoodRequestController(
            FoodRequestRepository requestRepository,
            FoodDonationRepository donationRepository,
            UserRepository userRepository) {
        this.requestRepository = requestRepository;
        this.donationRepository = donationRepository;
        this.userRepository = userRepository;
    }

    // Submit a food request
    @PostMapping("/{donationId}")
    public ResponseEntity<?> requestFood(
            @PathVariable Long donationId) {

        User receiver = getLoggedInUser();

        if (receiver == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        if (!"RECEIVER".equalsIgnoreCase(receiver.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only receivers can request food.");
        }

        FoodDonation donation = donationRepository
                .findById(donationId)
                .orElse(null);

        if (donation == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Donation not found.");
        }

        if (!"AVAILABLE".equalsIgnoreCase(donation.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This food is no longer available.");
        }

        if (requestRepository.existsByDonationIdAndReceiverId(
                donationId, receiver.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You have already requested this donation.");
        }

        FoodRequest foodRequest = new FoodRequest();
        foodRequest.setDonation(donation);
        foodRequest.setReceiver(receiver);
        foodRequest.setStatus("PENDING");

        FoodRequest savedRequest =
                requestRepository.save(foodRequest);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Food request submitted successfully. Request ID: "
                        + savedRequest.getId());
    }

    // View requests belonging to the logged-in receiver
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests() {

        User receiver = getLoggedInUser();

        if (receiver == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in again.");
        }

        if (!"RECEIVER".equalsIgnoreCase(receiver.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only receivers can view their requests.");
        }

        List<FoodRequest> requests =
                requestRepository.findByReceiverId(receiver.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (FoodRequest request : requests) {
            FoodDonation donation = request.getDonation();

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("requestId", request.getId());
            item.put("donationId", donation.getId());
            item.put("foodType", donation.getFoodType());
            item.put("quantity", donation.getQuantity());
            item.put("location", donation.getLocation());
            item.put("status", request.getStatus());
            item.put("requestedAt", request.getRequestedAt());

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    // Donor views requests for their own donations
    @GetMapping("/donor-requests")
    public ResponseEntity<?> getDonorRequests() {

        User donor = getLoggedInUser();

        if (donor == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in again.");
        }

        if (!"DONOR".equalsIgnoreCase(donor.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only donors can view received requests.");
        }

        List<FoodRequest> requests =
                requestRepository.findByDonationDonorId(donor.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (FoodRequest request : requests) {
            FoodDonation donation = request.getDonation();

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("requestId", request.getId());
            item.put("donationId", donation.getId());
            item.put("foodType", donation.getFoodType());
            item.put("quantity", donation.getQuantity());
            item.put("location", donation.getLocation());
            item.put("receiverName", request.getReceiver().getName());
            item.put("status", request.getStatus());
            item.put("requestedAt", request.getRequestedAt());

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    // Donor approves or rejects a request
    @Transactional
    @PutMapping("/{requestId}/status/{status}")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long requestId,
            @PathVariable String status) {

        User donor = getLoggedInUser();

        if (donor == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in again.");
        }

        if (!"DONOR".equalsIgnoreCase(donor.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only donors can update requests.");
        }

        String newStatus = status.toUpperCase();

        if (!"APPROVED".equals(newStatus)
                && !"REJECTED".equals(newStatus)) {
            return ResponseEntity.badRequest()
                    .body("Status must be APPROVED or REJECTED.");
        }

        FoodRequest request = requestRepository
                .findById(requestId)
                .orElse(null);

        if (request == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Food request not found.");
        }

        FoodDonation donation = request.getDonation();

        if (donation.getDonor() == null
                || !donation.getDonor().getId().equals(donor.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You cannot update another donor's request.");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This request has already been processed.");
        }

        if ("APPROVED".equals(newStatus)
                && !"AVAILABLE".equalsIgnoreCase(donation.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This food is no longer available.");
        }

        // Update and save the request status
        request.setStatus(newStatus);
        FoodRequest savedRequest = requestRepository.save(request);

        System.out.println(
                "DEBUG: Request ID = " + savedRequest.getId()
                + ", Status saved = " + savedRequest.getStatus()
        );

        if ("APPROVED".equals(newStatus)) {
            // Mark the donation unavailable
            donation.setStatus("UNAVAILABLE");
            donationRepository.save(donation);

            // Reject other pending requests for this donation
            List<FoodRequest> otherPendingRequests =
                    requestRepository.findByDonation_IdAndStatus(
                            donation.getId(), "PENDING");

            for (FoodRequest otherRequest : otherPendingRequests) {
                if (!otherRequest.getId().equals(request.getId())) {
                    otherRequest.setStatus("REJECTED");
                }
            }

            requestRepository.saveAll(otherPendingRequests);
        }

        return ResponseEntity.ok(
                "Food request " + newStatus.toLowerCase()
                        + " successfully.");
    }

    // Get the currently logged-in user
    private User getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElse(null);
    }
}
