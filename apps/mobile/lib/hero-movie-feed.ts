import { HeroMovie } from "../types/hero-movie";

export function createHeroMovieFeed(
  ...movieGroups: HeroMovie[][]
): HeroMovie[] {
  const feed = movieGroups.flat();
  for (let index = feed.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [feed[index], feed[randomIndex]] = [feed[randomIndex], feed[index]];
  }
  return feed;
}
