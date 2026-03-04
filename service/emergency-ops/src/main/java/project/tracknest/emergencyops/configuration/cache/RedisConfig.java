package project.tracknest.emergencyops.configuration.cache;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

import java.time.Duration;

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

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()
                        )
                )
                .entryTtl(Duration.ofMinutes(5)); // default TTL

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
