export type SocialProfile = {
  provider: 'google' | 'naver' | 'kakao' | 'apple';
  providerAccountId: string;
  email: string;
  nickname: string;
};
