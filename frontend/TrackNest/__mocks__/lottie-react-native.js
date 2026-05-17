const React = require('react');
const { View } = require('react-native');

function LottieView({ style, source, autoPlay, loop, ...props }) {
  return React.createElement(View, { testID: 'lottie-loader', style });
}

module.exports = LottieView;
module.exports.default = LottieView;
