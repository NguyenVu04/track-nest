import { ActivityIndicator, Image, Text, View } from "react-native";

import { map as mapLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { loader } from "@/styles/loader";

export const LocationLoader = () => {
  const t = useTranslation(mapLang);

  return (
    <View style={loader.loadingContainer}>
      <View style={loader.loadingContent}>
        <View style={loader.loadingLogoCircle}>
          <Image
            source={require("@/assets/images/android-icon-foreground.png")}
            style={loader.loadingLogo}
          />
        </View>
        <Text style={loader.loadingTitle}>TrackNest</Text>
        <ActivityIndicator
          size="large"
          color="#74becb"
          style={loader.loadingSpinner}
        />
        <Text style={loader.loadingText}>{t.gettingLocation}</Text>
      </View>
    </View>
  );
};
