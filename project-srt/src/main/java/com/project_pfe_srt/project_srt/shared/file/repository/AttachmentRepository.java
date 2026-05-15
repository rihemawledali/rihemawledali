package com.project_pfe_srt.project_srt.shared.file.repository;

import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
}
