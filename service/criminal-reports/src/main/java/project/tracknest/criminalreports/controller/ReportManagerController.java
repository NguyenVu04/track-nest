package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.criminalreports.domain.reportmanager.ReportManagerService;

@RestController
@RequestMapping("/report-manager")
@RequiredArgsConstructor
public class ReportManagerController {
    private final ReportManagerService service;
}
