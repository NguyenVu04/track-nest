package project.tracknest.emergencyops.configuration.cache;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

@Configuration
public class RedisConfig {
    @Bean
    protected MessageListenerAdapter messageListenerAdapter(ServerRedisMessageReceiver serverRedisMessageReceiver) {
        return new MessageListenerAdapter(serverRedisMessageReceiver, "receiveMessage");
    }

    @Bean
    protected RedisMessageListenerContainer listenerContainer(
            MessageListenerAdapter listenerAdapter,
            RedisConnectionFactory redisConnectionFactory,
            ServerIdProvider idProvider
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(
                listenerAdapter,
                new ChannelTopic(idProvider.getServerId())
        );
        return container;
    }
}
