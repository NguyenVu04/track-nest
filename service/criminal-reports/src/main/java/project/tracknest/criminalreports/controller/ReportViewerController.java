package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.criminalreports.domain.reportviewer.ReportViewerService;

@RestController
@RequestMapping("/report-viewer")
@RequiredArgsConstructor
public class ReportViewerController {
    private final ReportViewerService service;
}
