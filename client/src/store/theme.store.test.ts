import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./theme.store";

describe("theme store", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to dark", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggle() switches from dark to light", () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggle() switches back from light to dark", () => {
    useThemeStore.getState().setTheme("light");
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("setTheme() updates the data-theme attribute on <html>", () => {
    useThemeStore.getState().setTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    useThemeStore.getState().setTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("toggle() also updates the data-theme attribute", () => {
    useThemeStore.getState().toggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe(useThemeStore.getState().theme);
  });
});
