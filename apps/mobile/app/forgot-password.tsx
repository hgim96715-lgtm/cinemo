import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePasswordReset } from "../hooks/use-password-reset";
import {
  passwordResetSchema,
  type PasswordResetForm,
} from "../schemas/auth.schema";
import { useVerifyPasswordResetCode } from "../hooks/use-verify-password-reset";
import { useState } from "react";

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

export default function ForgotPasswordScreen() {
  const passwordResetMutation = usePasswordReset();
  const router = useRouter();
  const verifyMutation = useVerifyPasswordResetCode();

  const [requestedEmail, setRequestedEmail] = useState("");
  const [code, setCode] = useState("");

  const { control, handleSubmit } = useForm<PasswordResetForm>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (form: PasswordResetForm) => {
    Keyboard.dismiss();
    const email = form.email.trim().toLowerCase();

    await passwordResetMutation.mutateAsync(email);
    setRequestedEmail(email);
    setCode("");
    verifyMutation.reset();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e1014]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1 px-6 pt-24">
          <Text className="text-center text-[32px] font-extrabold tracking-[4px] text-[#d4b56a]">
            CINEMO
          </Text>
          <Text className="mb-3 mt-8 text-center text-[22px] font-bold text-[#f3efe6]">
            비밀번호 찾기
          </Text>
          <Text className="mb-8 text-center text-sm leading-5 text-[#958d82]">
            가입한 이메일을 입력하면 비밀번호 재설정 메일을 보냅니다.
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <View>
                <Text className="mb-1 text-xs font-medium tracking-[2px] text-[#d4b56a]">
                  이메일
                </Text>

                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="이메일"
                  placeholderTextColor="#958d82"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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

          {!passwordResetMutation.isSuccess && (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                void handleSubmit(onSubmit)();
              }}
              disabled={passwordResetMutation.isPending}
              className="mt-6 items-center rounded-lg border border-[#d4b56a] py-3.5 active:border-[#ad4f59] active:bg-[#ad4f59]"
            >
              <Text className="text-base font-bold tracking-[2px] text-[#d4b56a]">
                {passwordResetMutation.isPending
                  ? "메일 발송 중..."
                  : "비밀번호 재설정 메일 보내기"}
              </Text>
            </Pressable>
          )}

          {passwordResetMutation.isSuccess && (
            <View className="mt-6">
              <Text className="text-[13px] leading-5 text-[#d4b56a]">
                입력한 이메일로 인증 코드를 보냈습니다.
              </Text>

              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  void handleSubmit(onSubmit)();
                }}
                disabled={passwordResetMutation.isPending}
                className="mt-2 self-start"
              >
                <Text className="text-[13px] text-[#958d82] underline">
                  {passwordResetMutation.isPending
                    ? "다시 보내는 중..."
                    : "인증 코드 다시 보내기"}
                </Text>
              </Pressable>

              <Text className="mb-2 mt-6 text-sm text-[#d4b56a]">
                이메일로 받은 6자리 인증 코드를 입력해주세요.
              </Text>

              <TextInput
                value={code}
                onChangeText={(value) => {
                  setCode(value);
                  if (verifyMutation.isError) {
                    verifyMutation.reset();
                  }
                }}
                placeholder="6자리 인증 코드"
                placeholderTextColor="#958d82"
                keyboardType="number-pad"
                maxLength={6}
                style={[inputTextStyle, { paddingLeft: 8 }]}
                className="rounded-none border-0 border-b border-[rgba(243,239,230,0.2)] bg-transparent px-0 text-base text-[#f3efe6] focus:outline-none"
              />

              {verifyMutation.isError && (
                <Text className="mt-3 text-[13px] text-[#ad4f59]">
                  인증 코드가 올바르지 않거나 만료되었습니다.
                </Text>
              )}

              <Pressable
                onPress={async () => {
                  try {
                    await verifyMutation.mutateAsync({
                      email: requestedEmail,
                      code,
                    });

                    router.push({
                      pathname: "/reset-password",
                      params: {
                        email: requestedEmail,
                        code,
                      },
                    });
                  } catch {
                    // React Query 상태로 오류 문구를 표시함
                  }
                }}
                disabled={verifyMutation.isPending || code.length !== 6}
                className="mt-6 items-center rounded-lg border border-[#d4b56a] py-3.5"
              >
                <Text className="font-bold tracking-[2px] text-[#d4b56a]">
                  {verifyMutation.isPending ? "확인 중..." : "인증 코드 확인"}
                </Text>
              </Pressable>
            </View>
          )}
          {passwordResetMutation.isError && (
            <Text className="mt-4 text-[13px] text-[#ad4f59]">
              이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.
            </Text>
          )}
          <Link href="/login" asChild>
            <Pressable className="mt-5 items-center">
              <Text className="text-sm text-[#958d82]">
                로그인으로 돌아가기
              </Text>
            </Pressable>
          </Link>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
