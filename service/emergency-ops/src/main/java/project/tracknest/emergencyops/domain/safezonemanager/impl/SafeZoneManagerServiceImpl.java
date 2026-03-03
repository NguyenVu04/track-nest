package project.tracknest.emergencyops.domain.safezonemanager.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.core.entity.SafeZone;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.safezonemanager.service.SafeZoneManagerService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class SafeZoneManagerServiceImpl implements SafeZoneManagerService {
    private final SafeZoneManagerSafeZoneRepository safeZoneRepository;
    private final SafeZoneManagerEmergencyServiceRepository emergencyServiceRepository;

    @Override
    @Transactional
    public PostSafeZoneResponse createSafeZone(UUID serviceId, PostSafeZoneRequest request) {
        Optional<EmergencyService> serviceOpt = emergencyServiceRepository.findById(serviceId);
        if (serviceOpt.isEmpty()) {
            log.error("Emergency service with id {} not found when creating safe zone", serviceId);
            throw new IllegalArgumentException("Emergency service not found");
        }

        EmergencyService service = serviceOpt.get();

        SafeZone safeZone = SafeZone
                .builder()
                .emergencyService(service)
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radius(request.getRadius())
                .build();

        SafeZone savedSafeZone = safeZoneRepository.saveAndFlush(safeZone);

        Long createdAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return PostSafeZoneResponse
                .builder()
                .id(savedSafeZone.getId())
                .createdAtMs(createdAtMs)
                .build();
    }

    @Override
    public PageResponse<GetServiceSafeZonesResponse> retrieveServiceSafeZones(
            UUID serviceId,
            String nameFilter,
            Pageable pageable
    ){
        Page<SafeZone> safeZonePage = safeZoneRepository
                .findByEmergencyService_Id(serviceId, nameFilter, pageable);

        List<GetServiceSafeZonesResponse> safeZoneResponses = safeZonePage
                .map(sz -> new GetServiceSafeZonesResponse(
                        sz.getLatitude(),
                        sz.getLongitude(),
                        sz.getRadius(),
                        sz.getName(),
                        sz.getCreatedAt()
                ))
                .getContent();

        return new PageResponse<>(
                safeZoneResponses,
                safeZonePage.getTotalElements(),
                safeZonePage.getTotalPages(),
                safeZonePage.getNumber(),
                safeZonePage.getSize()
        );
    }

    @Override
    public PutSafeZoneResponse updateSafeZone(UUID serviceId, UUID safeZoneId, PutSafeZoneRequest request) {
        Optional<SafeZone> safeZoneOpt = safeZoneRepository
                .findByIdAndEmergencyService_Id(safeZoneId, serviceId);

        if (safeZoneOpt.isEmpty()) {
            log.warn("Safe zone with id {} not found for service id {} when updating", safeZoneId, serviceId);
            throw new IllegalArgumentException("Safe zone not found");
        }

        SafeZone safeZone = safeZoneOpt.get();
        safeZone.setName(request.getName());
        safeZone.setLatitude(request.getLatitude());
        safeZone.setLongitude(request.getLongitude());
        safeZone.setRadius(request.getRadius());

        SafeZone updatedSafeZone = safeZoneRepository.save(safeZone);

        Long updatedAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return PutSafeZoneResponse
                .builder()
                .id(updatedSafeZone.getId())
                .updatedAtMs(updatedAtMs)
                .build();
    }

    @Override
    public DeleteSafeZoneResponse deleteSafeZone(UUID serviceId, UUID safeZoneId) {
        Optional<SafeZone> safeZoneOpt = safeZoneRepository
                .findByIdAndEmergencyService_Id(safeZoneId, serviceId);

        if (safeZoneOpt.isEmpty()) {
            log.warn("Safe zone with id {} not found for service id {} when deleting", safeZoneId, serviceId);
            throw new IllegalArgumentException("Safe zone not found");
        }

        safeZoneRepository.delete(safeZoneOpt.get());

        Long deletedAtMs = OffsetDateTime.now()
                .toInstant()
                .toEpochMilli();

        return DeleteSafeZoneResponse
                .builder()
                .id(safeZoneId)
                .deletedAtMs(deletedAtMs)
                .build();
    }
}
