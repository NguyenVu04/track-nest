-- Outbox table for STOMP user-queue messages that could not be delivered
-- because the user was offline at the moment messagingTemplate.convertAndSendToUser
-- was called. A SessionConnectedEvent listener flushes the rows when the
-- user (re)connects, giving at-least-once delivery for emergency notifications.
--
-- Mounted on a fresh emergency-ops Postgres volume only — re-seeding requires
-- `docker compose down -v` (no migration framework in this project).

CREATE TABLE pending_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    destination VARCHAR(128) NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Hot path: "give me everything that's still PENDING for this user, oldest first"
CREATE INDEX idx_pending_notification_user_created
    ON pending_notification (user_id, created_at)
    WHERE delivered_at IS NULL;

-- Housekeeping: a periodic job (optional, not implemented here) can prune
-- delivered rows older than N days using this covering index.
CREATE INDEX idx_pending_notification_delivered_at
    ON pending_notification (delivered_at)
    WHERE delivered_at IS NOT NULL;
