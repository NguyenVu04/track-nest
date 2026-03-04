package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import project.tracknest.usertracking.core.datatype.LocationMessage;

interface LocationMessageConsumer {
    void trackTaget(LocationMessage message);
}
