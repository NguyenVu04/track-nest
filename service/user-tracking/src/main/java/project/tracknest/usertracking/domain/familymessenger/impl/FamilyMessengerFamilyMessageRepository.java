package project.tracknest.usertracking.domain.familymessenger.impl;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.tracknest.usertracking.core.entity.FamilyMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

interface FamilyMessengerFamilyMessageRepository extends JpaRepository<FamilyMessage, UUID> {
    @Query("""
        SELECT fm
        FROM FamilyMessage fm
        WHERE fm.familyCircleId = :familyCircleId
        ORDER BY fm.createdAt DESC, fm.id DESC
    """)
    Slice<FamilyMessage> findFirstPageByFamilyCircleId(
            @Param("familyCircleId") UUID familyCircleId,
            Pageable pageable
    );

    @Query("""
        SELECT fm
        FROM FamilyMessage fm
        WHERE fm.familyCircleId = :familyCircleId
          AND (
                fm.createdAt < :lastCreatedAt
                OR (fm.createdAt = :lastCreatedAt AND fm.id < :lastId)
          )
        ORDER BY fm.createdAt DESC, fm.id DESC
    """)
    Slice<FamilyMessage> findNextPageByFamilyCircleId(
            @Param("familyCircleId") UUID familyCircleId,
            @Param("lastCreatedAt") OffsetDateTime lastCreatedAt,
            @Param("lastId") UUID lastId,
            Pageable pageable
    );
}
