package project.tracknest.usertracking.domain.notifier.impl;

import project.tracknest.usertracking.core.datatype.RiskNotificationMessage;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;

interface NotificationMessageConsumer {
    void sendTrackingNotification(TrackingNotificationMessage message);

    void sendRiskNotification(RiskNotificationMessage message);
}
