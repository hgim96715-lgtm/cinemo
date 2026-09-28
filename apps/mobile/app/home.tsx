import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { styles } from "../styles/index.styles";
import { useHeroMovieFeed } from "../hooks/use-hero-movie-feed";
import { TodayChart } from "../components/TodayChart";
import { formatAudienceCount } from "../lib/format-audience-count";
import { HomeHeader } from "../components/HomeHeader";

export default function HomeScreen() {
  const {
    data: heroMovies = [],
    chartMovies,
    upcomingMovies = [],
    isPending,
    isFetching,
    isError,
  } = useHeroMovieFeed();
  const [heroIndex, setHeroIndex] = useState(0);
  const opacity = useSharedValue(1);
  const currentHeroMovie = heroMovies[heroIndex];

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [heroIndex, opacity]);

  useEffect(() => {
    if (heroMovies.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      const nextIndex = (heroIndex + 1) % heroMovies.length;
      opacity.value = withTiming(
        0,
        {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          "worklet";
          if (finished) {
            scheduleOnRN(setHeroIndex, nextIndex);
          }
        },
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [heroIndex, opacity, heroMovies.length]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        {isError ? (
          <Text style={styles.heroDescription}>
            영화 차트를 불러오지 못했습니다.
          </Text>
        ) : isPending || !currentHeroMovie ? (
          <ActivityIndicator size="large" color="#d8b45a" />
        ) : (
          <Animated.View style={[styles.heroSection, animatedContentStyle]}>
            {currentHeroMovie.posterPath ? (
              <Image
                source={{
                  uri: `https://image.tmdb.org/t/p/w780${currentHeroMovie.posterPath}`,
                }}
                style={styles.heroPoster}
              />
            ) : (
              <View
                style={[styles.heroPoster, { backgroundColor: "#24242b" }]}
              />
            )}

            <View style={styles.heroOverlay}>
              <Text style={styles.heroMeta}>
                {currentHeroMovie.source === "CHART"
                  ? `TOP ${currentHeroMovie.rank}`
                  : currentHeroMovie.source === "COMING_SOON"
                    ? "COMING SOON"
                    : "CINEMO PICK"}
              </Text>
              <Text style={styles.heroTitle}>{currentHeroMovie.title}</Text>
              <Text style={styles.heroMeta}>
                {currentHeroMovie.source === "CHART"
                  ? `누적 관객수 · ${formatAudienceCount(currentHeroMovie.audienceCount)}`
                  : `개봉일 · ${currentHeroMovie.releaseDate ?? "개봉일 미정"}`}
              </Text>
              {isFetching ? (
                <Text style={styles.heroMeta}>업데이트 중...</Text>
              ) : null}
            </View>
          </Animated.View>
        )}

        {chartMovies.length > 0 ? <TodayChart movies={chartMovies} /> : null}

        <View style={styles.board}>
          <Text style={styles.boardTitle}>RELEASE BOARD</Text>

          {upcomingMovies.slice(0, 3).map((movie) => (
            <View key={movie.tmdbId} style={styles.boardRow}>
              <Text style={styles.boardDate}>
                {movie.releaseDate.slice(5).replace("-", ".")}
              </Text>

              <Text style={styles.boardMovieTitle} numberOfLines={1}>
                {movie.title}
              </Text>

              <Text style={styles.boardStatus}>
                {movie.genres?.slice(0, 2).join(" · ") ?? "장르 정보 없음"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.board}>
          <Text style={styles.boardTitle}>EXPLORE CINEMO</Text>

          <Link href="/upcoming" style={styles.sectionTitle}>
            MOVIE CHART
          </Link>

          <Link href="/upcoming" style={styles.sectionTitle}>
            COMING SOON
          </Link>

          <Link href="/upcoming" style={styles.sectionTitle}>
            MY CINEMA
          </Link>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
