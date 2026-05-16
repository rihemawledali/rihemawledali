package com.project_pfe_srt.project_srt.auth.repository;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.entity.Role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    List<User> findAllByOrderByIdAsc();
    List<User> findAllByRoleOrderByIdAsc(Role role);
}
