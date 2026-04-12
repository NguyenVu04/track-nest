CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE chat_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    role VARCHAR(15) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'))
);

CREATE TABLE chat_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    document_id UUID NOT NULL
);

CREATE TABLE chat_message_in_session (
    chat_message_id UUID NOT NULL,
    chat_session_id UUID NOT NULL,
    PRIMARY KEY (chat_message_id, chat_session_id)
);

ALTER TABLE chat_message_in_session
    ADD CONSTRAINT fk_chat_message FOREIGN KEY (chat_message_id) REFERENCES chat_message (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_chat_session FOREIGN KEY (chat_session_id) REFERENCES chat_session (id) ON DELETE CASCADE;