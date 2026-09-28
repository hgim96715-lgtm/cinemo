import { useEffect } from "react";
import { CINEMO_COLORS } from "@cinemo/shared";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useMovieChart } from "../hooks/use-movie-chart";
import { useUpcomingMovies } from "../hooks/use-upcoming-movies";

const LOGO = "cinemo";
const LETTER_DELAY = 220;
const LETTER_DURATION = 520;
const INTRO_DURATION = 3200;

type AnimatedLetterProps = {
  letter: string;
  index: number;
  finalColor: string;
};

function AnimatedLetter({ letter, index, finalColor }: AnimatedLetterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * LETTER_DELAY,
      withTiming(1, {
        duration: LETTER_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    color: interpolateColor(progress.value, [0, 1], ["#f5f1e8", finalColor]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [14, 0]),
      },
    ],
  }));

  return (
    <Animated.Text style={[styles.logo, animatedStyle]}>{letter}</Animated.Text>
  );
}

export default function IntroScreen() {
  useMovieChart();
  useUpcomingMovies();

  const descriptionProgress = useSharedValue(0);

  useEffect(() => {
    descriptionProgress.value = withDelay(
      1500,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
    );

    const timer = setTimeout(() => {
      router.replace("/home");
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, [descriptionProgress]);

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionProgress.value,
    transform: [
      {
        translateY: interpolate(descriptionProgress.value, [0, 1], [12, 0]),
      },
    ],
  }));

  const logoColors = [
    CINEMO_COLORS.gold,
    CINEMO_COLORS.gold,
    CINEMO_COLORS.gold,
    CINEMO_COLORS.gold,
    "#cf6b51",
    CINEMO_COLORS.red,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.logoRow}>
          {LOGO.split("").map((letter, index) => (
            <AnimatedLetter
              key={`${letter}-${index}`}
              letter={letter}
              index={index}
              finalColor={logoColors[index]}
            />
          ))}
        </View>

        <Animated.Text style={[styles.description, descriptionStyle]}>
          영화를 찾고 나만의 기록을 남겨보세요
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CINEMO_COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    color: CINEMO_COLORS.gold,
    fontSize: 72,
    fontWeight: "700",
    letterSpacing: 7,
  },
  description: {
    marginTop: 24,
    color: CINEMO_COLORS.muted,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
