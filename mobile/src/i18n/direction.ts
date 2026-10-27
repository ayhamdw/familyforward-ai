import { I18nManager } from "react-native";

/** Single place that reads the native layout direction, so it can be mocked in tests. */
export function isRTL(): boolean {
  return I18nManager.isRTL;
}

export function chevronBackName(rtl: boolean): "chevron-back" | "chevron-forward" {
  return rtl ? "chevron-forward" : "chevron-back";
}

export function chevronForwardName(rtl: boolean): "chevron-forward" | "chevron-back" {
  return rtl ? "chevron-back" : "chevron-forward";
}
