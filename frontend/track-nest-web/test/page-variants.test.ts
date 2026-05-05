import { EASE, fadeUp, fadeIn, slideLeft, slideRight, scaleIn } from "@/app/page";

jest.mock("framer-motion", () => ({}));
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock("next/link", () => ({}));

describe("animation variant factories", () => {
  describe("fadeUp.visible", () => {
    it("returns opacity 1 and y 0", () => {
      const result = (fadeUp.visible as (d: number) => Record<string, unknown>)(0);
      expect(result).toMatchObject({ opacity: 1, y: 0 });
    });

    it("passes delay into the transition", () => {
      const result = (fadeUp.visible as (d: number) => { transition: { delay: number } })(0.3);
      expect(result.transition.delay).toBe(0.3);
    });

    it("defaults delay to 0 when called with no argument", () => {
      const fn = fadeUp.visible as (d?: number) => { transition: { delay: number } };
      expect(fn().transition.delay).toBe(0);
    });

    it("uses EASE as the transition easing", () => {
      const result = (fadeUp.visible as (d: number) => { transition: { ease: unknown } })(0);
      expect(result.transition.ease).toBe(EASE);
    });
  });

  describe("fadeIn.visible", () => {
    it("returns opacity 1", () => {
      const result = (fadeIn.visible as (d: number) => Record<string, unknown>)(0);
      expect(result).toMatchObject({ opacity: 1 });
    });

    it("passes delay into the transition", () => {
      const result = (fadeIn.visible as (d: number) => { transition: { delay: number } })(0.2);
      expect(result.transition.delay).toBe(0.2);
    });

    it("defaults delay to 0 when called with no argument", () => {
      const fn = fadeIn.visible as (d?: number) => { transition: { delay: number } };
      expect(fn().transition.delay).toBe(0);
    });
  });

  describe("slideLeft.visible", () => {
    it("returns opacity 1 and x 0", () => {
      const result = (slideLeft.visible as (d: number) => Record<string, unknown>)(0);
      expect(result).toMatchObject({ opacity: 1, x: 0 });
    });

    it("passes delay into the transition", () => {
      const result = (slideLeft.visible as (d: number) => { transition: { delay: number } })(0.5);
      expect(result.transition.delay).toBe(0.5);
    });

    it("defaults delay to 0 when called with no argument", () => {
      const fn = slideLeft.visible as (d?: number) => { transition: { delay: number } };
      expect(fn().transition.delay).toBe(0);
    });
  });

  describe("slideRight.visible", () => {
    it("returns opacity 1 and x 0", () => {
      const result = (slideRight.visible as (d: number) => Record<string, unknown>)(0);
      expect(result).toMatchObject({ opacity: 1, x: 0 });
    });

    it("passes delay into the transition", () => {
      const result = (slideRight.visible as (d: number) => { transition: { delay: number } })(0.1);
      expect(result.transition.delay).toBe(0.1);
    });

    it("defaults delay to 0 when called with no argument", () => {
      const fn = slideRight.visible as (d?: number) => { transition: { delay: number } };
      expect(fn().transition.delay).toBe(0);
    });
  });

  describe("scaleIn.visible", () => {
    it("returns opacity 1 and scale 1", () => {
      const result = (scaleIn.visible as (d: number) => Record<string, unknown>)(0);
      expect(result).toMatchObject({ opacity: 1, scale: 1 });
    });

    it("passes delay into the transition", () => {
      const result = (scaleIn.visible as (d: number) => { transition: { delay: number } })(0.4);
      expect(result.transition.delay).toBe(0.4);
    });

    it("defaults delay to 0 when called with no argument", () => {
      const fn = scaleIn.visible as (d?: number) => { transition: { delay: number } };
      expect(fn().transition.delay).toBe(0);
    });
  });

  describe("hidden states", () => {
    it("fadeUp starts hidden with opacity 0 and y 40", () => {
      expect(fadeUp.hidden).toEqual({ opacity: 0, y: 40 });
    });

    it("fadeIn starts hidden with opacity 0", () => {
      expect(fadeIn.hidden).toEqual({ opacity: 0 });
    });

    it("slideLeft starts hidden with opacity 0 and x -60", () => {
      expect(slideLeft.hidden).toEqual({ opacity: 0, x: -60 });
    });

    it("slideRight starts hidden with opacity 0 and x 60", () => {
      expect(slideRight.hidden).toEqual({ opacity: 0, x: 60 });
    });

    it("scaleIn starts hidden with opacity 0 and scale 0.88", () => {
      expect(scaleIn.hidden).toEqual({ opacity: 0, scale: 0.88 });
    });
  });
});
