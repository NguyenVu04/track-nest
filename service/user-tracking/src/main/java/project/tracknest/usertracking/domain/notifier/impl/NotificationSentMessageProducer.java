package project.tracknest.usertracking.domain.notifier.impl;

import project.tracknest.usertracking.core.datatype.NotificationSentMessage;

interface NotificationSentMessageProducer {
    void produce(NotificationSentMessage message);
}
