import React from "react";
import { render } from "@testing-library/react-native";
import AuthLayout from "@/app/auth/_layout";

jest.mock("cross-fetch", () => jest.fn(), { virtual: true });

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, style }: any) => {
    const { View } = require("react-native");
    return <View style={style}>{children}</View>;
  },
}));

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: any) => children ?? null,
    { Screen: () => null },
  ),
}));

describe("AuthLayout (auth/)", () => {
  it("renders without crashing", () => {
    expect(() => render(<AuthLayout />)).not.toThrow();
  });

  it("renders a SafeAreaView wrapper", () => {
    const { UNSAFE_getByType } = render(<AuthLayout />);
    const { View } = require("react-native");
    expect(UNSAFE_getByType(View)).toBeTruthy();
  });
});
