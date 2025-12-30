package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;

@RestController
@RequestMapping("/missing-person-request-receiver")
@RequiredArgsConstructor
public class MissingPersonRequestReceiverController {
    private final MissingPersonRequestReceiverService service;
}
