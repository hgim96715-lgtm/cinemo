import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101116",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  logo: {
    color: "#d8b45a",
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: "700",
  },
  eyebrow: {
    marginTop: 48,
    color: "#8e8c86",
    fontSize: 11,
    letterSpacing: 2,
  },
  heroSection: {
    marginTop: 8,
    height: 360,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#1a1a1f",
  },
  heroPoster: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    padding: 24,
    backgroundColor: "rgba(8, 9, 13, 0.58)",
  },
  heroTitle: {
    marginTop: 6,
    color: "#f5f1e8",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  heroMeta: {
    marginTop: 10,
    color: "#d8b45a",
    fontSize: 13,
    letterSpacing: 1,
  },
  heroDescription: {
    marginTop: 10,
    color: "#d2d0ca",
    fontSize: 14,
    lineHeight: 21,
  },
  board: {
    marginTop: 36,
  },
  boardTitle: {
    color: "#d8b45a",
    fontSize: 12,
    letterSpacing: 2,
  },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a30",
  },
  boardDate: {
    width: 72,
    color: "#8e8c86",
    fontSize: 12,
  },
  boardMovieTitle: {
    flex: 1,
    color: "#f5f1e8",
    fontSize: 15,
    fontWeight: "600",
  },
  boardStatus: {
    color: "#d8b45a",
    fontSize: 11,
  },
  sectionTitle: {
    marginTop: 28,
    color: "#aaa7a0",
    fontSize: 12,
    letterSpacing: 1,
  },
});
