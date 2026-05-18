import { Animated, Image, Text, View } from "react-native";

import { map as mapLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { loader } from "@/styles/loader";
import { AppLoader } from "./AppLoader";

export const MapViewLoader = ({
  fadeAnim,
  isMapReady,
}: {
  fadeAnim: Animated.Value;
  isMapReady: boolean;
}) => {
  const t = useTranslation(mapLang);

  return (
    <Animated.View
      style={[loader.loadingOverlay, { opacity: fadeAnim }]}
      pointerEvents={isMapReady ? "none" : "auto"}
    >
      <View style={loader.loadingContent}>
        <View style={loader.loadingLogoCircle}>
          <Image
            source={require("@/assets/images/android-icon-foreground.png")}
            style={loader.loadingLogo}
          />
        </View>
        <Text style={loader.loadingTitle}>TrackNest</Text>
        <AppLoader size={150} />
        <Text style={loader.loadingText}>{t.loadingMap}</Text>
      </View>
    </Animated.View>
  );
};
