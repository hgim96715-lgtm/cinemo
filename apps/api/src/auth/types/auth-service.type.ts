export type PublicProfile =
  | {
      nickname: string;
      profilePublic: true;
      bio: string | null;
      tags: string[];
    }
  | {
      nickname: string;
      profilePublic: false;
    };

export type AuthUserRow = {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  lastLoginProvider: 'email' | 'google' | 'naver' | 'kakao' | 'apple' | null;
  isTestAccount: boolean;
  bio?: string | null;
  profilePublic: boolean;
  tags?: string[];
};
