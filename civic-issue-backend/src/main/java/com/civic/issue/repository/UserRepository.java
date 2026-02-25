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

    // ✅ NEW — find all users with a specific role
    List<User> findByRole(RoleType role);

    // ✅ NEW — find regional admin for a specific zone
    Optional<User> findByRoleAndZone(RoleType role, Zone zone);
}
