package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.criminalreports.domain.reportadmin.ReportAdminService;

@RestController
@RequestMapping("/report-admin")
@RequiredArgsConstructor
public class ReportAdminController {
    private final ReportAdminService service;
}
