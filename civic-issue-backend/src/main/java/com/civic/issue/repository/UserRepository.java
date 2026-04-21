package com.civic.issue.repository;

import com.civic.issue.entity.User;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(RoleType role);

    Optional<User> findByRoleAndZone(RoleType role, Zone zone);

    // ── OAuth (from fix8b) ──────────────────────────────────────────────────
    Optional<User> findByOauthProviderAndOauthId(String oauthProvider, String oauthId);

    // ── WhatsApp/SMS (fix9) ─────────────────────────────────────────────────
    Optional<User> findByPhone(String phone);
}
