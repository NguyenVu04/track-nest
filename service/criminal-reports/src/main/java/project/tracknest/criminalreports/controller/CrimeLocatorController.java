package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.domain.crimelocator.CrimeLocatorService;

@RestController
@RequestMapping("/crime-locator")
@RequiredArgsConstructor
@Slf4j
public class CrimeLocatorController {
    private final CrimeLocatorService service;
}