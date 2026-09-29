import { zodResolver } from "@hookform/resolvers/zod";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { Link, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
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
import { useRegister } from "../hooks/use-register";
import { Ionicons } from "@expo/vector-icons";
import { registerSchema, type RegisterForm } from "../schemas/auth.schema";

const EMAIL_DOMAINS = [
  { label: "gmail.com", value: "gmail.com" },
  { label: "naver.com", value: "naver.com" },
  { label: "daum.net", value: "daum.net" },
  { label: "icloud.com", value: "icloud.com" },
  { label: "직접 입력", value: "custom" },
] as const;

const inputTextStyle = {
  height: 48,
  paddingVertical: 0,
  lineHeight: Platform.OS === "web" ? 48 : 20,
  textAlignVertical: "center" as const,
  fontFamily: "Pretendard-Regular",
};

const passwordInputStyle = {
  height: 48,
  flex: 1,
  minWidth: 0,
  paddingVertical: 0,
  paddingHorizontal: 0,
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center" as const,
  fontFamily: "Pretendard-Regular",
};

const plainTextInputStyle = {
  ...inputTextStyle,
  paddingVertical: Platform.OS === "web" ? 14 : 0,
  lineHeight: Platform.OS === "web" ? 20 : undefined,
};

export default function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const domainSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["45%"], []);
  const [isDomainSheetOpen, setIsDomainSheetOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const openDomainSheet = () => {
    Keyboard.dismiss();

    requestAnimationFrame(() => {
      setIsDomainSheetOpen(true);
      domainSheetRef.current?.present();
    });
  };

  const { control, handleSubmit, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      emailLocal: "",
      emailDomain: "gmail.com",
      customDomain: "",
      nickname: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const selectedDomain = watch("emailDomain");

  const onSubmit = async (form: RegisterForm) => {
    const domain =
      form.emailDomain === "custom"
        ? form.customDomain?.trim()
        : form.emailDomain;

    if (!domain) return;

    await registerMutation.mutateAsync({
      email: `${form.emailLocal.trim()}@${domain}`,
      password: form.password,
      nickname: form.nickname.trim(),
    });

    router.replace("/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0e1014]">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text className="text-center text-[32px] font-extrabold tracking-[4px] text-[#d4b56a]">
            CINEMO
          </Text>

          <Text className="mb-8 mt-3 text-center text-[22px] font-bold text-[#f3efe6]">
            회원가입
          </Text>

          <Text className="mb-2 text-xs font-medium tracking-[2px] text-[#d4b56a]">
            이메일
          </Text>
          <View className="mb-3.5 flex-row items-start gap-2">
            <Controller
              control={control}
              name="emailLocal"
              render={({ field, fieldState }) => (
                <View className="flex-1">
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="아이디"
                    placeholderTextColor="#958d82"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    multiline={false}
                    style={[plainTextInputStyle, { paddingLeft: 8 }]}
                    className="border-b border-[rgba(243,239,230,0.2)] bg-transparent px-0 text-base text-[#f3efe6] focus:border-[#ad4f59] focus:outline-none"
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

            <Text className="pt-3.5 text-lg text-[#958d82]">@</Text>

            <View className="flex-1">
              {selectedDomain === "custom" ? (
                <Controller
                  control={control}
                  name="customDomain"
                  render={({ field, fieldState }) => (
                    <View>
                      <View
                        style={{ minWidth: 0 }}
                        className="flex-row items-center overflow-hidden border-b border-[rgba(243,239,230,0.2)] bg-transparent"
                      >
                        <TextInput
                          value={field.value ?? ""}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          autoFocus
                          placeholder="직접 입력"
                          placeholderTextColor="#958d82"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          style={[
                            plainTextInputStyle,
                            { flex: 1, minWidth: 0, paddingLeft: 8 },
                          ]}
                          className="px-0 text-base text-[#f3efe6] focus:outline-none"
                        />
                        <Pressable
                          onPress={openDomainSheet}
                          accessibilityLabel="도메인 선택"
                          style={{ height: 48, flexShrink: 0, width: 44 }}
                          className="items-center justify-center focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2"
                        >
                          <Ionicons
                            name={
                              isDomainSheetOpen
                                ? "chevron-up-outline"
                                : "chevron-down-outline"
                            }
                            size={20}
                            color="#d4b56a"
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
              ) : (
                <Pressable
                  onPress={openDomainSheet}
                  style={{ height: 48, paddingLeft: 8 }}
                  className="flex-row items-center justify-between border-b border-[rgba(243,239,230,0.2)] bg-transparent pr-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2"
                >
                  <Text className="text-base text-[#f3efe6]">
                    {selectedDomain}
                  </Text>
                  <Ionicons
                    name={
                      isDomainSheetOpen
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={20}
                    color="#d4b56a"
                  />
                </Pressable>
              )}
            </View>
          </View>

          <Controller
            control={control}
            name="nickname"
            render={({ field, fieldState }) => (
              <View className="mb-3.5">
                <Text className="mb-1 text-xs font-medium tracking-[2px] text-[#d4b56a]">
                  닉네임
                </Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="닉네임"
                  placeholderTextColor="#958d82"
                  style={[
                    plainTextInputStyle,
                    { width: "100%", paddingHorizontal: 8 },
                  ]}
                  className="border-b border-[rgba(243,239,230,0.2)] bg-transparent text-base text-[#f3efe6] focus:border-[#d4b56a] focus:outline-none"
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
                    textContentType="none"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={passwordInputStyle}
                    className="px-0 text-[#f3efe6] focus:outline-none"
                  />
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
                    accessibilityLabel={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                    className="px-2 py-3.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
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
                <Text className="mb-1 text-xs font-medium tracking-[2px] text-[#d4b56a]">
                  비밀번호 확인
                </Text>
                <View className="flex-row items-center border-b border-[rgba(243,239,230,0.2)]">
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    secureTextEntry={!showPasswordConfirm}
                    autoComplete="off"
                    textContentType="none"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={passwordInputStyle}
                    className="px-0 text-[#f3efe6] focus:outline-none"
                  />
                  <Pressable
                    onPress={() =>
                      setShowPasswordConfirm((visible) => !visible)
                    }
                    accessibilityLabel={
                      showPasswordConfirm
                        ? "비밀번호 확인 숨기기"
                        : "비밀번호 확인 보기"
                    }
                    className="px-2 py-3.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2"
                  >
                    <Ionicons
                      name={
                        showPasswordConfirm ? "eye-off-outline" : "eye-outline"
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

          {registerMutation.isError && (
            <Text className="mb-2 text-[13px] text-[#ad4f59]">
              회원가입에 실패했습니다. 입력 정보를 확인해주세요.
            </Text>
          )}

          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              void handleSubmit(onSubmit)();
            }}
            disabled={registerMutation.isPending}
            className="mt-3 items-center rounded-lg border border-[#d4b56a] bg-transparent py-3.5 active:border-[#ad4f59] active:bg-[#ad4f59] focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2"
          >
            {({ pressed }) => (
              <Text
                className={`text-base font-bold tracking-[2px] ${pressed ? "text-[#f3efe6]" : "text-[#d4b56a]"}`}
              >
                {registerMutation.isPending ? "가입 중..." : "회원가입"}
              </Text>
            )}
          </Pressable>

          <Link href="/login" asChild>
            <Pressable className="mt-5 items-center focus:outline-none focus-visible:outline-2 focus-visible:outline-[#d4b56a] focus-visible:outline-offset-2">
              <Text className="text-sm text-[#958d82]">
                이미 계정이 있다면 로그인
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetModal
        ref={domainSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#17171a" }}
        onChange={(index) => setIsDomainSheetOpen(index >= 0)}
        onDismiss={() => setIsDomainSheetOpen(false)}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 32,
          }}
        >
          <Text className="mb-4 text-base font-bold text-[#f3efe6]">
            이메일 도메인 선택
          </Text>

          {EMAIL_DOMAINS.map((domain) => (
            <Pressable
              key={domain.value}
              onPress={() => {
                setValue("emailDomain", domain.value, {
                  shouldValidate: true,
                });
                domainSheetRef.current?.dismiss();
              }}
              className="py-3"
            >
              <Text className="text-sm text-[#f3efe6]">{domain.label}</Text>
            </Pressable>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
