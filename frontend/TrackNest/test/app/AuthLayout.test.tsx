import React from "react";
import { render } from "@testing-library/react-native";
import AuthLayout from "@/app/(auth)/_layout";

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: any) => children ?? null,
    {
      Screen: ({ name }: any) => null,
    },
  ),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, style }: any) => {
    const { View } = require("react-native");
    return <View style={style}>{children}</View>;
  },
}));
// cross-fetch may not be available in all test environments; stub it
jest.mock("cross-fetch", () => jest.fn(), { virtual: true });

describe("AuthLayout", () => {
  it("renders without crashing", () => {
    expect(() => render(<AuthLayout />)).not.toThrow();
  });

  it("renders a SafeAreaView wrapper", () => {
    const { UNSAFE_getByType } = render(<AuthLayout />);
    const { View } = require("react-native");
    expect(UNSAFE_getByType(View)).toBeTruthy();
  });
});
