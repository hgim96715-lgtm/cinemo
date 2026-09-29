import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "../schemas/auth.schema";
import { useResetPassword } from "../hooks/use-reset-password";

const inputTextStyle = {
  height: 48,
  paddingVertical: 0,
  lineHeight: Platform.OS === "web" ? 48 : 20,
  textAlignVertical: "center" as const,
  fontFamily: "Pretendard-Regular",
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const params = useLocalSearchParams<{
    email?: string;
    code?: string;
  }>();

  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const resetPasswordMutation = useResetPassword();

  const { control, handleSubmit } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      newPassword: "",
      passwordConfirm: "",
    },
  });
  const onSubmit = async (form: ResetPasswordForm) => {
    if (!email || !code) return;

    await resetPasswordMutation.mutateAsync({
      email,
      code,
      newPassword: form.newPassword,
    });

    router.replace("/login");
  };

  if (!email || !code) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#0e1014] px-6">
        <Text className="text-center text-[#ad4f59]">
          인증 정보가 없습니다.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0e1014]">
      <View className="flex-1 px-6 pt-24">
        <Text className="text-center text-[32px] font-extrabold tracking-[4px] text-[#d4b56a]">
          CINEMO
        </Text>

        <Text className="mb-3 mt-8 text-center text-[22px] font-bold text-[#f3efe6]">
          새 비밀번호 설정
        </Text>

        <Text className="mb-8 text-center text-sm text-[#958d82]">
          새로운 비밀번호를 입력해주세요.
        </Text>

        <Controller
          control={control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <View className="mb-3.5">
              <Text className="mb-1 text-xs tracking-[2px] text-[#d4b56a]">
                새 비밀번호
              </Text>

              <View className="flex-row items-center border-b border-[rgba(243,239,230,0.2)]">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="새 비밀번호"
                  placeholderTextColor="#958d82"
                  style={[inputTextStyle, { flex: 1, paddingLeft: 8 }]}
                  className="px-0 text-base text-[#f3efe6] focus:outline-none"
                />
                <Pressable
                  onPress={() => setShowNewPassword((visible) => !visible)}
                  accessibilityLabel={
                    showNewPassword ? "새 비밀번호 숨기기" : "새 비밀번호 보기"
                  }
                  className="items-center justify-center px-2 focus:outline-none"
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#958d82"
                  />
                </Pressable>
              </View>

              <View className="min-h-[22px]">
                {fieldState.error && (
                  <Text className="mt-1.5 text-[13px] text-[#ad4f59]">
                    {fieldState.error.message}
                  </Text>
                )}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="passwordConfirm"
          render={({ field, fieldState }) => (
            <View className="mb-3.5">
              <Text className="mb-1 text-xs tracking-[2px] text-[#d4b56a]">
                새 비밀번호 확인
              </Text>

              <View className="flex-row items-center border-b border-[rgba(243,239,230,0.2)]">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="새 비밀번호 확인"
                  placeholderTextColor="#958d82"
                  style={[inputTextStyle, { flex: 1, paddingLeft: 8 }]}
                  className="px-0 text-base text-[#f3efe6] focus:outline-none"
                />
                <Pressable
                  onPress={() => setShowPasswordConfirm((visible) => !visible)}
                  accessibilityLabel={
                    showPasswordConfirm
                      ? "새 비밀번호 확인 숨기기"
                      : "새 비밀번호 확인 보기"
                  }
                  className="items-center justify-center px-2 focus:outline-none"
                >
                  <Ionicons
                    name={
                      showPasswordConfirm ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#958d82"
                  />
                </Pressable>
              </View>

              <View className="min-h-[22px]">
                {fieldState.error && (
                  <Text className="mt-1.5 text-[13px] text-[#ad4f59]">
                    {fieldState.error.message}
                  </Text>
                )}
              </View>
            </View>
          )}
        />

        {resetPasswordMutation.isError && (
          <Text className="mt-2 text-[13px] text-[#ad4f59]">
            {axios.isAxiosError(resetPasswordMutation.error)
              ? (resetPasswordMutation.error.response?.data?.message ??
                "비밀번호 변경에 실패했습니다.")
              : "비밀번호 변경에 실패했습니다."}
          </Text>
        )}

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            void handleSubmit(onSubmit)();
          }}
          disabled={resetPasswordMutation.isPending}
          className="mt-6 items-center rounded-lg border border-[#d4b56a] py-3.5"
        >
          <Text className="font-bold tracking-[2px] text-[#d4b56a]">
            {resetPasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
          </Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable className="mt-5 items-center">
            <Text className="text-sm text-[#958d82]">로그인으로 돌아가기</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
