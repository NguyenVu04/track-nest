CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE chat_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    content TEXT NOT NULL,
    role VARCHAR(15) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (role IN ('USER', 'MODEL'))
);

CREATE TABLE chat_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    document_id UUID NOT NULL,
    message_left SMALLINT NOT NULL DEFAULT 0
);

ALTER TABLE chat_message
    ADD CONSTRAINT fk_chat_session FOREIGN KEY (session_id) REFERENCES chat_session(id) ON DELETE CASCADE;