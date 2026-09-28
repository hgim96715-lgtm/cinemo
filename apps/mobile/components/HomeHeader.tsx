import { CINEMO_COLORS, CINEMO_RADIUS } from "@cinemo/shared";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuthUser } from "../hooks/use-auth-user";

export function HomeHeader() {
  const { data: user } = useAuthUser();
  const router = useRouter();

  return (
    <View className="flex-row itmes-center justify-between py-3">
      <Text className="text-xl font-bold tracking-[2px] text-[#d4b56a]">
        cinemo
      </Text>
      {user ? (
        <Pressable onPress={() => router.replace("/my-page")}>
          <Text className="text-[13px] font-semibold text-[#f3efe6]">
            {user.nickname}
          </Text>
        </Pressable>
      ) : (
        <Link href="/login" asChild>
          <Pressable className="rounded-md border border-[rgba(212,181,106,0.45)] px-3.5 py-2">
            <Text className="text-[13px] font-semibold text-[#f3efe6]">
              로그인
            </Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}
