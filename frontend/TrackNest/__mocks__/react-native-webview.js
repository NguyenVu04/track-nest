const React = require('react');
const { View } = require('react-native');

const WebView = ({ style, ...props }) => React.createElement(View, { style });

module.exports = { WebView };
module.exports.default = WebView;
