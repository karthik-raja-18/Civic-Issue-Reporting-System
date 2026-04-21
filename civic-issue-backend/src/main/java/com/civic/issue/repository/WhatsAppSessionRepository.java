package com.civic.issue.repository;

import com.civic.issue.entity.WhatsAppSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WhatsAppSessionRepository extends JpaRepository<WhatsAppSession, Long> {
    Optional<WhatsAppSession> findByPhone(String phone);
}
