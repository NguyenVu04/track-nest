package project.tracknest.emergencyops.domain.emergencyresponder.impl;


import project.tracknest.emergencyops.core.datatype.LocationMessage;

interface LocationMessageConsumer {
    void trackTaget(LocationMessage message);
}
