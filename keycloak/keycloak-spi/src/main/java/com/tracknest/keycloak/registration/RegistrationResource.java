package com.tracknest.keycloak.registration;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.keycloak.models.*;

@Path("/public-register")
@Consumes({MediaType.APPLICATION_JSON, MediaType.APPLICATION_JSON})
public class RegistrationResource {
    private final KeycloakSession session;

    public RegistrationResource(KeycloakSession session) {
        this.session = session;
    }

    @POST
    public Response register(RegisterRequest request) {
        RealmModel realm = session.getContext().getRealm();
        UserProvider users = session.users();

        if (users.getUserByUsername(realm, request.getUsername()) != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Username already exists")
                    .build();
        }

        if (users.getUserByEmail(realm, request.getEmail()) != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Email already exists")
                    .build();
        }

        UserModel user = users.addUser(realm, request.getUsername());
        user.setEnabled(true);
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmailVerified(false);
        user.setSingleAttribute("phoneNumber", request.getPhoneNumber());

        user.credentialManager()
                .updateCredential(
                        UserCredentialModel.password(
                                request.getPassword(),
                                false));

        return Response.ok("User registered successfully").build();
    }
}
