import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { MovieChartItem } from "../lib/movie-chart-api";

type TodayCahrProps = {
  movies: MovieChartItem[];
};

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w780";
const CARD_GAP = 16;

export function TodayChart({ movies }: TodayCahrProps) {
  const listRef = useRef<FlatList<MovieChartItem>>(null);
  const currentIndex = useRef(0);
  const { width } = useWindowDimensions();
  const [isInteracting, setIsInteracting] = useState(false);

  const cardWidth = Math.min(width * 0.72, 280);
  const itemSize = cardWidth + CARD_GAP;

  useEffect(() => {
    currentIndex.current = 0;

    listRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });
  }, [movies]);

  useEffect(() => {
    if (movies.length <= 1 || isInteracting) {
      return;
    }
    const timer = setInterval(() => {
      const nextIndex = (currentIndex.current + 1) & movies.length;
      currentIndex.current = nextIndex;
      listRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [isInteracting, movies.length]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    currentIndex.current = Math.max(
      0,
      Math.min(Math.round(offsetX / itemSize), movies.length - 1),
    );
    setIsInteracting(false);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>TODAY&apos;S CHART</Text>

      <FlatList
        ref={listRef}
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemSize}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => `${item.rank}-${item.title}`}
        getItemLayout={(_, index) => ({
          length: itemSize,
          offset: itemSize * index,
          index,
        })}
        onScrollBeginDrag={() => setIsInteracting(true)}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardWidth }]}>
            {item.posterPath ? (
              <Image
                source={{
                  uri: `${POSTER_BASE_URL}${item.posterPath}`,
                }}
                style={styles.poster}
              />
            ) : (
              <View style={[styles.poster, styles.posterFallback]} />
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.rank}>
                {String(item.rank).padStart(2, "0")}
              </Text>

              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
  },
  heading: {
    marginBottom: 16,
    color: "#d8b45a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  listContent: {
    paddingRight: 24,
  },
  card: {
    marginRight: CARD_GAP,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#1a1a1f",
  },
  poster: {
    width: "100%",
    height: 320,
    backgroundColor: "#24242b",
  },
  posterFallback: {
    opacity: 0.8,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  rank: {
    color: "#d8b45a",
    fontSize: 24,
    fontWeight: "700",
  },
  title: {
    flex: 1,
    color: "#f5f1e8",
    fontSize: 15,
    fontWeight: "600",
  },
});
