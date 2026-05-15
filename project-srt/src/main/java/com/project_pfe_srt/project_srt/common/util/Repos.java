package com.project_pfe_srt.project_srt.common.util;

import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import org.springframework.data.repository.CrudRepository;

/**
 * Short-hand for {@code repo.findById(id).orElseThrow(NotFoundException::new)}.
 * Use it to replace the dozens of inline lambdas that used to throw
 * {@code IllegalArgumentException("X introuvable.")} — those returned
 * 400; this returns the correct 404.
 *
 * <pre>{@code
 * Adhesion a = Repos.findOrThrow(adhesionRepository, id, "Adhésion");
 * }</pre>
 */
public final class Repos {

    private Repos() {}

    public static <T, ID> T findOrThrow(CrudRepository<T, ID> repo, ID id, String label) {
        return repo.findById(id).orElseThrow(() -> NotFoundException.of(label));
    }
}
