package com.tracknest.keycloak.registration;

import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.annotations.jaxrs.FormParam;
import org.jboss.resteasy.annotations.providers.multipart.MultipartForm;
import org.jboss.resteasy.annotations.providers.multipart.PartType;

import java.io.InputStream;

public class RegisterRequest {
    @FormParam("username")
    @PartType(MediaType.TEXT_PLAIN)
    private String username;

    @FormParam("email")
    @PartType(MediaType.TEXT_PLAIN)
    private String email;

    @FormParam("password")
    @PartType(MediaType.TEXT_PLAIN)
    private String password;

    @FormParam("firstName")
    @PartType(MediaType.TEXT_PLAIN)
    private String firstName;

    @FormParam("lastName")
    @PartType(MediaType.TEXT_PLAIN)
    private String lastName;

    @FormParam("phoneNumber")
    @PartType(MediaType.TEXT_PLAIN)
    private String phoneNumber;

    @FormParam("avatar")
    @PartType(MediaType.APPLICATION_OCTET_STREAM)
    private InputStream avatar;

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public InputStream getAvatar() {
        return avatar;
    }
}
