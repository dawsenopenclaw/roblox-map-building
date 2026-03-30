import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ParentalConsentEmailProps {
  childName: string
  parentEmail?: string
  approveUrl: string
  denyUrl: string
  privacyUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const ParentalConsentEmail = ({
  childName = 'your child',
  parentEmail,
  approveUrl,
  denyUrl,
  privacyUrl = `${baseUrl}/privacy`,
}: ParentalConsentEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>
      Action required: {childName} wants to join ForjeGames — parental consent needed
    </Preview>
    <Body style={body}>
      <Container style={container}>
        {/* Logo Header */}
        <Section style={logoSection}>
          <Text style={logoText}>
            <span style={logoSpan}>Forje</span>
            <span style={logoGold}>Games</span>
          </Text>
        </Section>

        <Hr style={divider} />

        {/* COPPA Banner */}
        <Section style={coppaBanner}>
          <Text style={coppaLabel}>PARENTAL CONSENT REQUIRED</Text>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Heading style={heading}>A message for parents</Heading>
          <Text style={intro}>
            Your child <strong style={childNameStyle}>{childName}</strong> has signed up for
            ForjeGames, an AI-powered platform for creating Roblox games and maps.
          </Text>
          <Text style={subtext}>
            Because {childName} is under 13, we are required by the{' '}
            <strong>Children&apos;s Online Privacy Protection Act (COPPA)</strong> to obtain
            your consent before they can use our service.
          </Text>
        </Section>

        {/* What is ForjeGames */}
        <Section style={infoSection}>
          <Text style={infoHeading}>What is ForjeGames?</Text>
          <Text style={infoText}>
            ForjeGames lets kids use AI to design and build Roblox game maps, browse
            community templates, and learn basic game design concepts — all within a
            safe, moderated environment.
          </Text>
        </Section>

        {/* Safety Info */}
        <Section style={safetyGrid}>
          <Section style={safetyCard}>
            <Text style={safetyIcon}>&#128274;</Text>
            <Text style={safetyTitle}>Privacy first</Text>
            <Text style={safetyDesc}>
              We collect only the minimum data needed. No selling data. No advertising.
            </Text>
          </Section>
          <Section style={safetyCard}>
            <Text style={safetyIcon}>&#128100;</Text>
            <Text style={safetyTitle}>Parent controls</Text>
            <Text style={safetyDesc}>
              You can view activity, pause the account, or delete data at any time.
            </Text>
          </Section>
          <Section style={safetyCard}>
            <Text style={safetyIcon}>&#128241;</Text>
            <Text style={safetyTitle}>Safe content</Text>
            <Text style={safetyDesc}>
              All community content is moderated. Kids cannot chat with strangers.
            </Text>
          </Section>
        </Section>

        {/* Action Buttons */}
        <Section style={actionSection}>
          <Text style={actionHeading}>Your decision</Text>
          <Text style={actionDesc}>
            By clicking Approve, you confirm you are the parent or legal guardian of{' '}
            {childName} and consent to their use of ForjeGames.
          </Text>

          <Section style={buttonGroup}>
            <Button style={approveButton} href={approveUrl}>
              Approve Account
            </Button>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '12px' }}>
            <Button style={denyButton} href={denyUrl}>
              Deny &amp; Delete Account
            </Button>
          </Section>
        </Section>

        {/* Important Notes */}
        <Section style={notesSection}>
          <Text style={notesHeading}>Important notes</Text>
          <Text style={noteItem}>
            &#8226; This link expires in <strong>48 hours</strong>
          </Text>
          <Text style={noteItem}>
            &#8226; If you did not create this account, click Deny — no data is stored until
            you approve
          </Text>
          <Text style={noteItem}>
            &#8226; You can revoke consent and delete all data at any time by emailing{' '}
            <Link href="mailto:privacy@ForjeGames.com" style={emailLink}>
              privacy@ForjeGames.com
            </Link>
          </Text>
          <Text style={noteItem}>
            &#8226; Read our full{' '}
            <Link href={privacyUrl} style={emailLink}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href={`${baseUrl}/coppa`} style={emailLink}>
              COPPA Compliance Statement
            </Link>
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This email was sent to{' '}
            {parentEmail ? (
              <span style={{ color: '#6b74a8' }}>{parentEmail}</span>
            ) : (
              'you'
            )}{' '}
            because your child listed you as their parent or guardian.
          </Text>
          <Text style={footerLinks}>
            <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
            {' · '}
            <Link href={`${baseUrl}/coppa`} style={footerLink}>COPPA</Link>
            {' · '}
            <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
          </Text>
          <Text style={footerAddress}>
            ForjeGames Inc. · All rights reserved
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ParentalConsentEmail

// Styles
const body: React.CSSProperties = {
  backgroundColor: '#060914',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  borderRadius: '16px',
  border: '1px solid #1e2347',
  maxWidth: '600px',
  margin: '0 auto',
  overflow: 'hidden',
}

const logoSection: React.CSSProperties = {
  padding: '28px 40px 20px',
  textAlign: 'center',
}

const logoText: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0',
}

const logoSpan: React.CSSProperties = {
  color: '#ffffff',
}

const logoGold: React.CSSProperties = {
  color: '#FFB81C',
}

const divider: React.CSSProperties = {
  borderColor: '#1e2347',
  margin: '0',
}

const coppaBanner: React.CSSProperties = {
  backgroundColor: '#1a1f4d',
  borderBottom: '1px solid #2d3480',
  padding: '10px 40px',
  textAlign: 'center',
}

const coppaLabel: React.CSSProperties = {
  color: '#8b9cf4',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
}

const contentSection: React.CSSProperties = {
  padding: '36px 40px 16px',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 16px',
  lineHeight: '1.2',
}

const intro: React.CSSProperties = {
  color: '#c5cbe8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
}

const childNameStyle: React.CSSProperties = {
  color: '#FFB81C',
}

const subtext: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const infoSection: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  padding: '20px 24px',
}

const infoHeading: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '13px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const infoText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const safetyGrid: React.CSSProperties = {
  padding: '0 40px 24px',
}

const safetyCard: React.CSSProperties = {
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '8px',
}

const safetyIcon: React.CSSProperties = {
  fontSize: '20px',
  margin: '0 0 6px',
}

const safetyTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px',
}

const safetyDesc: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const actionSection: React.CSSProperties = {
  padding: '0 40px 28px',
}

const actionHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const actionDesc: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 20px',
}

const buttonGroup: React.CSSProperties = {
  textAlign: 'center',
}

const approveButton: React.CSSProperties = {
  backgroundColor: '#FFB81C',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 36px',
  textDecoration: 'none',
  display: 'inline-block',
}

const denyButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #ef4444',
  borderRadius: '8px',
  color: '#ef4444',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

const notesSection: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#080c1f',
  border: '1px solid #1e2347',
  borderRadius: '12px',
  padding: '20px 24px',
}

const notesHeading: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 12px',
}

const noteItem: React.CSSProperties = {
  color: '#6b74a8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const emailLink: React.CSSProperties = {
  color: '#FFB81C',
  textDecoration: 'none',
}

const footer: React.CSSProperties = {
  padding: '24px 40px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0 0 8px',
  lineHeight: '1.5',
}

const footerLinks: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerLink: React.CSSProperties = {
  color: '#6b74a8',
  textDecoration: 'none',
}

const footerAddress: React.CSSProperties = {
  color: '#323760',
  fontSize: '11px',
  margin: '0',
}
