package com.civic.issue.service.impl;

import com.civic.issue.dto.response.NotificationResponse;
import com.civic.issue.entity.User;
import com.civic.issue.repository.NotificationRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .message(n.getMessage())
                        .createdAt(n.getCreatedAt())
                        .read(n.isRead())
                        .build())
                .toList();
    }
}
