import LottieView from "lottie-react-native";

type AppLoaderProps = {
  size?: number;
};

export function AppLoader({ size = 180 }: AppLoaderProps) {
  return (
    <LottieView
      source={require("@/assets/hummingbird1.json")}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
