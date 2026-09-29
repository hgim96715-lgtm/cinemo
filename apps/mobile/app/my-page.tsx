import { Link, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogout } from "../hooks/use-logout";
import { useAuthUser } from "../hooks/use-auth-user";

export default function MyPage() {
  const router = useRouter();
  const { data: user } = useAuthUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace("/home");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e1014] px-6 pt-8">
      <Text className="mb-2 text-2xl font-bold text-[#f3efe6]">
        {user?.nickname}님
      </Text>

      <Text className="mb-8 text-[#958d82]">내 프로필</Text>

      <Link href="/home" asChild>
        <Pressable className="rounded-md border border-[#ad4f59] px-4 py-3">
          <Text className="text-center font-semibold text-[#ad4f59]">
            홈으로
          </Text>
        </Pressable>
      </Link>

      <Pressable
        onPress={handleLogout}
        disabled={logoutMutation.isPending}
        className="rounded-md border border-[#ad4f59] px-4 py-3 mt-10"
      >
        <Text className=" text-center font-semibold text-[#ad4f59]">
          {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
