export type DemoPersonas = {
  nicknames: string[];
  reviews: { body: string; rating: number }[];
  profiles: {
    bio: string | null;
    tags: string[];
    profilePublic: boolean;
  }[];
};

export type DemoUser = {
  id: string;
  nickname: string;
  email: string;
  isNew: boolean;
};

export type DemoSeedSummary = {
  date: string;
  activities: number;
  createdUsers: number;
  createdPostcards: number;
};
