// package: project.tracknest.usertracking.proto
// file: notifier.proto

var notifier_pb = require("./notifier_pb");
var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb");
var google_protobuf_wrappers_pb = require("google-protobuf/google/protobuf/wrappers_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var NotifierController = (function () {
  function NotifierController() {}
  NotifierController.serviceName = "project.tracknest.usertracking.proto.NotifierController";
  return NotifierController;
}());

NotifierController.postMobileDevice = {
  methodName: "postMobileDevice",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: notifier_pb.MobileDeviceRequest,
  responseType: google_protobuf_wrappers_pb.StringValue
};

NotifierController.deleteMobileDevice = {
  methodName: "deleteMobileDevice",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.getTrackingNotifications = {
  methodName: "getTrackingNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: notifier_pb.TrackingNotificationResponse
};

NotifierController.getRiskNotifications = {
  methodName: "getRiskNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: notifier_pb.RiskNotificationResponse
};

NotifierController.deleteTrackingNotification = {
  methodName: "deleteTrackingNotification",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.deleteRiskNotification = {
  methodName: "deleteRiskNotification",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_wrappers_pb.StringValue,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.deleteTrackingNotifications = {
  methodName: "deleteTrackingNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: notifier_pb.NotificationIds,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.deleteRiskNotifications = {
  methodName: "deleteRiskNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: notifier_pb.NotificationIds,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.deleteAllTrackingNotifications = {
  methodName: "deleteAllTrackingNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: google_protobuf_empty_pb.Empty
};

NotifierController.deleteAllRiskNotifications = {
  methodName: "deleteAllRiskNotifications",
  service: NotifierController,
  requestStream: false,
  responseStream: false,
  requestType: google_protobuf_empty_pb.Empty,
  responseType: google_protobuf_empty_pb.Empty
};

exports.NotifierController = NotifierController;

function NotifierControllerClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

NotifierControllerClient.prototype.postMobileDevice = function postMobileDevice(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.postMobileDevice, {
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

NotifierControllerClient.prototype.deleteMobileDevice = function deleteMobileDevice(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteMobileDevice, {
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

NotifierControllerClient.prototype.getTrackingNotifications = function getTrackingNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.getTrackingNotifications, {
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

NotifierControllerClient.prototype.getRiskNotifications = function getRiskNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.getRiskNotifications, {
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

NotifierControllerClient.prototype.deleteTrackingNotification = function deleteTrackingNotification(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteTrackingNotification, {
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

NotifierControllerClient.prototype.deleteRiskNotification = function deleteRiskNotification(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteRiskNotification, {
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

NotifierControllerClient.prototype.deleteTrackingNotifications = function deleteTrackingNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteTrackingNotifications, {
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

NotifierControllerClient.prototype.deleteRiskNotifications = function deleteRiskNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteRiskNotifications, {
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

NotifierControllerClient.prototype.deleteAllTrackingNotifications = function deleteAllTrackingNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteAllTrackingNotifications, {
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

NotifierControllerClient.prototype.deleteAllRiskNotifications = function deleteAllRiskNotifications(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(NotifierController.deleteAllRiskNotifications, {
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

exports.NotifierControllerClient = NotifierControllerClient;

