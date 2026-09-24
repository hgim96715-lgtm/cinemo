export const registerQueryKeys = {
  availability: {
    email: (email: string) =>
      ['register', 'availability', 'email', email] as const,

    nickname: (nickname: string) =>
      ['register', 'availability', 'nickname', nickname] as const,
  },
} as const;
