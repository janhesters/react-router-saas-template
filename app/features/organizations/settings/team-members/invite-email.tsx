import { Button, Container, Html, Text } from "@react-email/components";

type InviteEmailProps = {
  /**
   * Pre-translated and interpolated strings from:
   * organizations.settings.team-members.invite-email.*
   */
  title: string;
  description: string;
  callToAction: string;
  buttonText: string;
  buttonUrl: string;
};

/**
 * Email template for organization invites.
 * Usage:
 * ```tsx
 * <InviteEmail
 *   title={t('organizations:settings.team-members.invite-email.title')}
 *   description={t('organizations:settings.team-members.invite-email.description', {
 *     inviterName,
 *     organizationName
 *   })}
 *   callToAction={t('organizations:settings.team-members.invite-email.call-to-action')}
 *   buttonText={t('organizations:settings.team-members.invite-email.button-text', {
 *     organizationName
 *   })}
 *   buttonUrl={t('organizations:settings.team-members.invite-email.button-url', {
 *     joinUrl
 *   })}
 * />
 * ```
 */
export function InviteEmail({
  title,
  description,
  callToAction,
  buttonText,
  buttonUrl,
}: InviteEmailProps) {
  return (
    <Html dir="ltr" lang="en">
      <Container>
        <h1>
          <Text>{title}</Text>
        </h1>

        <p>
          <Text>{description}</Text>
        </p>

        <p>
          <Text>{callToAction}</Text>
        </p>

        <Button
          href={buttonUrl}
          style={{
            alignItems: "center",
            backgroundColor: "#6366f1",
            border: "none",
            borderRadius: "0.625rem",
            color: "#ffffff",
            cursor: "pointer",
            display: "inline-flex",
            fontSize: "14px",
            fontWeight: "500",
            justifyContent: "center",
            padding: "8px 16px",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          {buttonText}
        </Button>
      </Container>
    </Html>
  );
}
