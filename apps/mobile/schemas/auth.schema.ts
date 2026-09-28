import { z } from "zod";

const EMAIL_LOCAL_REGEX = /^[A-Za-z][A-Za-z0-9._-]*$/;
const DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i;

export const loginSchema = z.object({
  email: z.email("이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    emailLocal: z
      .string()
      .trim()
      .min(1, { error: "이메일을 입력해주세요" })
      .regex(EMAIL_LOCAL_REGEX, {
        error:
          "이메일 아이디는 영문으로 시작하고, 영문·숫자·., _, -만 입력해주세요",
      }),
    emailDomain: z.string().min(1, { error: "도메인을 선택해주세요" }),
    customDomain: z.string().optional(),
    nickname: z
      .string()
      .trim()
      .min(2, { error: "닉네임은 2자 이상이어야 합니다" })
      .max(20, { error: "닉네임은 20자 이하여야 합니다" }),
    password: z.string().min(8, {
      error: "비밀번호는 8자 이상이어야 합니다",
    }),
    passwordConfirm: z
      .string()
      .min(1, { error: "비밀번호를 다시 입력해주세요." }),
  })
  .superRefine((value, context) => {
    const domain =
      value.emailDomain === "custom"
        ? value.customDomain?.trim().toLowerCase()
        : value.emailDomain;

    if (!domain || !DOMAIN_REGEX.test(domain)) {
      context.addIssue({
        code: "custom",
        path:
          value.emailDomain === "custom" ? ["customDomain"] : ["emailDomain"],
        message: "도메인은 example.com 형식으로 입력해주세요.",
      });
      return;
    }

    const email = `${value.emailLocal.trim()}@${domain}`;

    if (!z.email().safeParse(email).success) {
      context.addIssue({
        code: "custom",
        path: ["emailLocal"],
        message: "이메일 형식을 확인해주세요.",
      });
    }

    if (
      value.password &&
      value.passwordConfirm &&
      value.password !== value.passwordConfirm
    ) {
      context.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "비밀번호가 일치하지 않습니다.",
      });
    }
  });

export type RegisterForm = z.infer<typeof registerSchema>;
