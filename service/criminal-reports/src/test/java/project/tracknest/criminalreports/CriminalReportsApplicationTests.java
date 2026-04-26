package project.tracknest.criminalreports;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import project.tracknest.criminalreports.config.TestSecurityConfig;

@SpringBootTest
@Import(TestSecurityConfig.class)
class CriminalReportsApplicationTests extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
