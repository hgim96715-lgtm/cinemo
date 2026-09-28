import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../styles/index.styles";

export default function UpcomingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "개봉 예정", headerShown: false }} />
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="홈으로 돌아가기"
      >
        <Ionicons name="arrow-back" size={28} color="#d8b45a" />
      </Pressable>
      <Text style={styles.eyebrow}>COMING SOON</Text>
      <Text style={styles.eyebrow}>곧 만날 영화들</Text>
    </SafeAreaView>
  );
}
