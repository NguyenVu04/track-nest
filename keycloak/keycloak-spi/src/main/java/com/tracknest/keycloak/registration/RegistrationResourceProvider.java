package com.tracknest.keycloak.registration;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;

public class RegistrationResourceProvider implements RealmResourceProvider {
    private final KeycloakSession session;

    public RegistrationResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public Object getResource() {
        return new RegistrationResource(session);
    }

    @Override
    public void close() {}
}
