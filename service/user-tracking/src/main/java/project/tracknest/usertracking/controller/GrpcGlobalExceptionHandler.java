package project.tracknest.usertracking.controller;

import io.grpc.*;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Slf4j
public class GrpcGlobalExceptionHandler implements ServerInterceptor {
    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        ServerCall<ReqT, RespT> safeCall = new ForwardingServerCall.SimpleForwardingServerCall<>(call) { };

        ServerCall.Listener<ReqT> delegate = next.startCall(safeCall, headers);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<>(delegate) {
            @Override
            public void onMessage(ReqT message) {
                try {
                    super.onMessage(message);
                } catch (Throwable t) {
                    handleAndClose(t, safeCall);
                    throw t instanceof RuntimeException ? (RuntimeException) t : new RuntimeException(t);
                }
            }

            @Override
            public void onHalfClose() {
                try {
                    super.onHalfClose();
                } catch (Throwable t) {
                    handleAndClose(t, safeCall);
                    throw t instanceof RuntimeException ? (RuntimeException) t : new RuntimeException(t);
                }
            }
        };
    }

    private void handleAndClose(Throwable t, ServerCall<?, ?> call) {
        Status status = mapToStatus(t);
        Metadata trailers = new Metadata();
        String description = t.getMessage() != null ? t.getMessage() : status.getDescription();
        log.error("gRPC call failed with status {} - {}", status, description, t);

        call.close(status.withDescription(description).withCause(t), trailers);
    }
    //TODO: Add localization support!!!
    private Status mapToStatus(Throwable t) {
        if (t instanceof StatusRuntimeException) {
            return ((StatusRuntimeException) t).getStatus();
        }
        if (t instanceof IllegalArgumentException || t instanceof ConstraintViolationException) {
            return Status.INVALID_ARGUMENT;
        }
        if (t instanceof AuthenticationException) {
            return Status.UNAUTHENTICATED;
        }

        return Status.INTERNAL;
    }
}