ALTER TABLE mobile_device
    ADD CONSTRAINT uq_mobile_device_user_token UNIQUE (user_id, device_token);
