package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.criminalreports.domain.criminalanalyzer.CriminalAnalyzerService;

@RestController
@RequestMapping("/criminal-analyzer")
@RequiredArgsConstructor
public class CriminalAnalyzerController {
    private final CriminalAnalyzerService service;
}
