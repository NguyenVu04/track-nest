// package: project.tracknest.usertracking.proto
// file: trackingmanager.proto

var trackingmanager_pb = require("./trackingmanager_pb");
var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb");
var google_protobuf_wrappers_pb = require("google-protobuf/google/protobuf/wrappers_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var TrackingManagerController = (function () {
  function TrackingManagerController() {}
  TrackingManagerController.serviceName = "project.tracknest.usertracking.proto.TrackingManagerController";
  return TrackingManagerController;
}());

TrackingManagerController.postConnection = {
  methodName: "postConnection",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: trackingmanager_pb.ConnectionRequest,
  responseType: google_protobuf_empty_pb.Empty
};

TrackingManagerController.deleteTracker = {
  methodName: "deleteTracker",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

TrackingManagerController.deleteTarget = {
  methodName: "deleteTarget",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

TrackingManagerController.postTrackingPermission = {
  methodName: "postTrackingPermission",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: trackingmanager_pb.PermissionResponse
};

TrackingManagerController.deleteTrackingPermission = {
  methodName: "deleteTrackingPermission",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

TrackingManagerController.getUserTargets = {
  methodName: "getUserTargets",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: true,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: trackingmanager_pb.TargetResponse
};

TrackingManagerController.getUserTrackers = {
  methodName: "getUserTrackers",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: true,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: trackingmanager_pb.TrackerResponse
};

TrackingManagerController.putTrackingStatus = {
  methodName: "putTrackingStatus",
  service: TrackingManagerController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.BoolValue,
  responseType: google_protobuf_empty_pb.Empty
};

exports.TrackingManagerController = TrackingManagerController;

function TrackingManagerControllerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

TrackingManagerControllerClient.prototype.postConnection = function postConnection(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.postConnection, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

TrackingManagerControllerClient.prototype.deleteTracker = function deleteTracker(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.deleteTracker, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

TrackingManagerControllerClient.prototype.deleteTarget = function deleteTarget(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.deleteTarget, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

TrackingManagerControllerClient.prototype.postTrackingPermission = function postTrackingPermission(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.postTrackingPermission, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

TrackingManagerControllerClient.prototype.deleteTrackingPermission = function deleteTrackingPermission(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.deleteTrackingPermission, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

TrackingManagerControllerClient.prototype.getUserTargets = function getUserTargets(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(TrackingManagerController.getUserTargets, {
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

TrackingManagerControllerClient.prototype.getUserTrackers = function getUserTrackers(requestMessage, metadata) {
  var listeners = {
    data: [],
    end: [],
    status: []
  };
  var client = grpc.invoke(TrackingManagerController.getUserTrackers, {
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

TrackingManagerControllerClient.prototype.putTrackingStatus = function putTrackingStatus(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(TrackingManagerController.putTrackingStatus, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

exports.TrackingManagerControllerClient = TrackingManagerControllerClient;

