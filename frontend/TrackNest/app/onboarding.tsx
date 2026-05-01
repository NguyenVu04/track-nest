import { onboarding as onboardingLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
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
        <Ionicons name={item.icon} size={84} color="#15616D" />
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

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  actionButton: {
    minWidth: 142,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#15616D",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    minWidth: 96,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#94A3B8",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginBottom: 20,
  },
  skipLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  dot: {
    backgroundColor: "#CBD5E1",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#15616D",
    width: 22,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});
