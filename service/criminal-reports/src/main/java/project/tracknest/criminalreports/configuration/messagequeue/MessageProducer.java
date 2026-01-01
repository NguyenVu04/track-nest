package project.tracknest.criminalreports.configuration.messagequeue;

public interface MessageProducer<T> {
    void produce(String topic, T message);
}
