# ----------------------------
# Stage 1: Build Keycloak theme
# ----------------------------
FROM node:alpine3.23 AS theme-builder

WORKDIR /app

# Install yarn classic (not bundled in node:alpine3.23)
RUN npm install -g yarn

# Install Maven + Java (required by keycloakify)
RUN apk add --no-cache openjdk17 maven

# Copy theme project
COPY keycloak-theme/ ./keycloak-theme/

WORKDIR /app/keycloak-theme

# Install dependencies
RUN yarn install

# Build theme (this will call mvn internally)
RUN yarn build-keycloak-theme

# ----------------------------
# Stage 2: Keycloak image
# ----------------------------
FROM quay.io/keycloak/keycloak:latest

COPY --from=theme-builder /app/keycloak-theme/dist_keycloak/*.jar /opt/keycloak/providers/

RUN /opt/keycloak/bin/kc.sh build