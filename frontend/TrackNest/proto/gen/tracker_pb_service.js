// package: project.tracknest.usertracking.proto
// file: tracker.proto

var tracker_pb = require("./tracker_pb");
var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var TrackerController = (function () {
  function TrackerController() {}
  TrackerController.serviceName = "project.tracknest.usertracking.proto.TrackerController";
  return TrackerController;
}());

TrackerController.postLocation = {
  methodName: "postLocation",
  service: TrackerController,
  requestStream: true,
  responseStream: false,
  requestType: tracker_pb.LocationRequest,
  responseType: google_protobuf_empty_pb.Empty
};

TrackerController.getTargetsLastLocations = {
  methodName: "getTargetsLastLocations",
  service: TrackerController,
  requestStream: false,
  responseStream: true,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: tracker_pb.LocationResponse
};

TrackerController.getTargetLocationHistory = {
  methodName: "getTargetLocationHistory",
  service: TrackerController,
  requestStream: false,
  responseStream: true,
  requestType: tracker_pb.LocationHistoryRequest,
  responseType: tracker_pb.LocationResponse
};

exports.TrackerController = TrackerController;

function TrackerControllerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

TrackerControllerClient.prototype.postLocation = function postLocation(metadata) {
  var listeners = {
    end: [],
    status: []
  };
  var client = grpc.client(TrackerController.postLocation, {
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport
  });
  client.onEnd(function (status, statusMessage, trailers) {
    listeners.status.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners.end.forEach(function (handler) {
      handler({ code: status, details: statusMessage, metadata: trailers });
    });
    listeners = null;
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    write: function (requestMessage) {
      if (!client.started) {
        client.start(metadata);
      }
      client.send(requestMessage);
      return this;
    },
    end: function () {
      client.finishSend();
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

TrackerControllerClient.prototype.getTargetsLastLocations = function getTargetsLastLocations(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(TrackerController.getTargetsLastLocations, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

TrackerControllerClient.prototype.getTargetLocationHistory = function getTargetLocationHistory(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(TrackerController.getTargetLocationHistory, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onMessage: function (responseMessage) {
      listeners.data.forEach(function (handler) {
        handler(responseMessage);
      });
    },
    onEnd: function (status, statusMessage, trailers) {
      listeners.status.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners.end.forEach(function (handler) {
        handler({ code: status, details: statusMessage, metadata: trailers });
      });
      listeners = null;
    }
  });
  return {
    on: function (type, handler) {
      listeners[type].push(handler);
      return this;
    },
    cancel: function () {
      listeners = null;
      client.close();
    }
  };
};

exports.TrackerControllerClient = TrackerControllerClient;

