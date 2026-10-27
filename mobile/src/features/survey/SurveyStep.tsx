import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { ProgressHeader } from "@/components/ProgressHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { colors } from "@/theme/tokens";

type Props = {
  step: number;
  title: string;
  helper?: string;
  continueLabel: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  /** Extra footer content under the primary button (like a "Skip" link). */
  footerExtra?: ReactNode;
  children: ReactNode;
};

/** Shared frame for the six survey screens: progress header, title, helper, content and a pinned button. */
export function SurveyStep({ step, title, helper, continueLabel, onContinue, continueDisabled, footerExtra, children }: Props) {
  const router = useRouter();
  return (
    <ScreenContainer
      header={<ProgressHeader step={step} onBack={() => router.back()} />}
      footer={
        <>
          <PrimaryButton label={continueLabel} onPress={onContinue} disabled={continueDisabled} />
          {footerExtra}
        </>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {helper ? (
        <AppText variant="bodyLarge" color={colors.muted}>
          {helper}
        </AppText>
      ) : null}
      {children}
    </ScreenContainer>
  );
}
