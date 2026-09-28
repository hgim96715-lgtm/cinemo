import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginForm } from "../schemas/auth.schema";

const inputTextStyle = {
  height: 48,
  paddingVertical: 0,
  lineHeight: Platform.OS === "web" ? 48 : 20,
  textAlignVertical: "center" as const,
  fontFamily: "Pretendard-Regular",
};

const plainTextInputStyle = {
  ...inputTextStyle,
  paddingVertical: Platform.OS === "web" ? 14 : 0,
  lineHeight: Platform.OS === "web" ? 20 : undefined,
};

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (form: LoginForm) => {
    await loginMutation.mutateAsync(form);
    router.replace("/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e1014]">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 96,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text className="text-center text-[32px] font-extrabold tracking-[4px] text-[#d4b56a]">
            CINEMO
          </Text>
          <Text className="mb-8 mt-3 text-center text-[22px] font-bold text-[#f3efe6]">
            로그인
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <View className="mb-3.5">
                <Text className="mb-1 text-xs font-medium tracking-[2px] text-[#d4b56a]">
                  이메일
                </Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="이메일"
                  placeholderTextColor="#958d82"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[plainTextInputStyle, { paddingLeft: 8 }]}
                  className="rounded-none border-0 border-b border-[rgba(243,239,230,0.2)] bg-transparent px-0 text-base text-[#f3efe6] focus:border-[#ad4f59] focus:outline-none"
                />
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
            name="password"
            render={({ field, fieldState }) => (
              <View className="mb-3.5">
                <Text className="mb-1 text-xs font-medium tracking-[2px] text-[#d4b56a]">
                  비밀번호
                </Text>
                <View className="flex-row items-center border-b border-[rgba(243,239,230,0.2)]">
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="비밀번호"
                    placeholderTextColor="#958d82"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[inputTextStyle, { flex: 1, paddingLeft: 8 }]}
                    className="px-0 text-base text-[#f3efe6] focus:outline-none"
                  />
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
                    accessibilityLabel={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                    className="items-center justify-center px-2 focus:outline-none"
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
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

          {loginMutation.isError && (
            <Text className="text-[13px] text-[#ad4f59]">
              이메일 또는 비밀번호를 확인해주세요.
            </Text>
          )}

          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              void handleSubmit(onSubmit)();
            }}
            disabled={loginMutation.isPending}
            className="mt-3 items-center rounded-lg border border-[#d4b56a] bg-transparent py-3.5 active:border-[#ad4f59] active:bg-[#ad4f59]"
          >
            {({ pressed }) => (
              <Text
                className={`text-base font-bold tracking-[2px] ${pressed ? "text-[#f3efe6]" : "text-[#d4b56a]"}`}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Text>
            )}
          </Pressable>
          <Link href="/register" asChild>
            <Pressable className="mt-5 items-center">
              <Text className="text-sm text-[#958d82]">회원가입</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
