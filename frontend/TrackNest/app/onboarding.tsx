import { onboarding as onboardingLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { fontScale, moderateScale, scale } from "@/utils/responsive";
import { markIntroWalkthroughCompleted } from "@/utils/walkthrough";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { SafeAreaView } from "react-native-safe-area-context";

type IntroSlide = {
  key: string;
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useTranslation(onboardingLang);
  const [isFinishing, setIsFinishing] = useState(false);

  const slides = useMemo<IntroSlide[]>(
    () => [
      {
        key: "welcome",
        title: t.slideWelcomeTitle,
        text: t.slideWelcomeDescription,
        icon: "shield-checkmark-outline",
        backgroundColor: "#E8F6FA",
      },
      {
        key: "map",
        title: t.slideMapTitle,
        text: t.slideMapDescription,
        icon: "map-outline",
        backgroundColor: "#EDF8EF",
      },
      {
        key: "sos",
        title: t.slideSosTitle,
        text: t.slideSosDescription,
        icon: "alert-circle-outline",
        backgroundColor: "#FCEFEF",
      },
    ],
    [
      t.slideMapDescription,
      t.slideMapTitle,
      t.slideSosDescription,
      t.slideSosTitle,
      t.slideWelcomeDescription,
      t.slideWelcomeTitle,
    ],
  );

  const finishWalkthrough = useCallback(async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    await markIntroWalkthroughCompleted();
    router.replace("/");
  }, [isFinishing, router]);

  const renderItem = ({ item }: { item: IntroSlide }) => (
    <SafeAreaView
      style={[styles.slide, { backgroundColor: item.backgroundColor }]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={moderateScale(72)} color="#15616D" />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </SafeAreaView>
  );

  const renderNextButton = () => (
    <View style={styles.actionButton}>
      <Text style={styles.actionLabel}>{t.next}</Text>
      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
    </View>
  );

  const renderDoneButton = () => (
    <View style={styles.actionButton}>
      <Text style={styles.actionLabel}>{t.done}</Text>
      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
    </View>
  );

  const renderSkipButton = () => (
    <Pressable style={styles.skipButton}>
      <Text style={styles.skipLabel}>{t.skip}</Text>
    </Pressable>
  );

  return (
    <AppIntroSlider
      data={slides}
      renderItem={renderItem}
      onDone={finishWalkthrough}
      onSkip={finishWalkthrough}
      showSkipButton
      bottomButton
      renderNextButton={renderNextButton}
      renderDoneButton={renderDoneButton}
      renderSkipButton={renderSkipButton}
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
    />
  );
}

const ICON_SIZE = moderateScale(150);

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: scale(36),
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(24),
  },
  title: {
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: scale(16),
  },
  text: {
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
    paddingHorizontal: scale(10),
  },
  actionButton: {
    minWidth: scale(130),
    height: scale(46),
    minHeight: 44,
    borderRadius: scale(23),
    backgroundColor: "#15616D",
    paddingHorizontal: scale(20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: scale(10),
    marginBottom: scale(20),
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: fontScale(15),
    fontWeight: "700",
  },
  skipButton: {
    minWidth: scale(88),
    height: scale(40),
    minHeight: 44,
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#94A3B8",
    paddingHorizontal: scale(14),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scale(10),
    marginBottom: scale(20),
  },
  skipLabel: {
    color: "#334155",
    fontSize: fontScale(13),
    fontWeight: "700",
  },
  dot: {
    backgroundColor: "#CBD5E1",
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#15616D",
    width: moderateScale(22),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginHorizontal: 4,
  },
});
