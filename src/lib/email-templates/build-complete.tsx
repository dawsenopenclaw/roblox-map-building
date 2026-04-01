import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BuildCompleteEmailProps {
  buildType: string
  thumbnailUrl?: string
  buildName?: string
  dashboardUrl?: string
  buildId?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const BuildCompleteEmail = ({
  buildType = 'map',
  thumbnailUrl,
  buildName = 'Untitled Build',
  dashboardUrl = `${baseUrl}/dashboard`,
  buildId,
}: BuildCompleteEmailProps) => {
  const buildUrl = buildId
    ? `${baseUrl}/dashboard/builds/${buildId}`
    : dashboardUrl

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>Your {buildType} &quot;{buildName}&quot; is ready to use!</Preview>
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

          {/* Status Banner */}
          <Section style={statusBanner}>
            <Text style={statusDot}>&#9679;</Text>
            <Text style={statusLabel}>BUILD COMPLETE</Text>
          </Section>

          {/* Preview Thumbnail */}
          {thumbnailUrl ? (
            <Section style={thumbnailSection}>
              <Img
                src={thumbnailUrl}
                alt={`Preview of ${buildName}`}
                width="520"
                height="260"
                style={thumbnailImg}
              />
            </Section>
          ) : (
            <Section style={thumbnailPlaceholder}>
              <Text style={thumbnailPlaceholderIcon}>&#9670;</Text>
              <Text style={thumbnailPlaceholderText}>{buildName}</Text>
            </Section>
          )}

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={heading}>
              Your {buildType} is ready!
            </Heading>
            <Text style={buildNameLabel}>{buildName}</Text>
            <Text style={description}>
              Your AI-generated {buildType} has been built and is ready to import into
              Roblox Studio. Click below to view it in your dashboard, download the
              model files, or publish it to the community marketplace.
            </Text>
          </Section>

          {/* Action Buttons */}
          <Section style={actionsSection}>
            <Button style={primaryButton} href={buildUrl}>
              View in Dashboard
            </Button>
          </Section>

          <Section style={secondaryActionsSection}>
            <Button style={secondaryButton} href={`${buildUrl}?action=download`}>
              Download Model
            </Button>
            {'  '}
            <Button style={ghostButton} href={`${buildUrl}?action=publish`}>
              Publish to Marketplace
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Tips */}
          <Section style={tipsSection}>
            <Text style={tipsHeading}>Next steps</Text>
            <Text style={tipItem}>
              <span style={tipBullet}>→</span> Open Roblox Studio and use the
              ForjeGames plugin to import your build
            </Text>
            <Text style={tipItem}>
              <span style={tipBullet}>→</span> Customize colors, add scripting,
              and configure spawn points
            </Text>
            <Text style={tipItem}>
              <span style={tipBullet}>→</span> Publish to the Roblox marketplace
              and start earning
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ForjeGames &mdash; AI-powered Roblox game building
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>Privacy Policy</Link>
              {' · '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>Terms of Service</Link>
              {' · '}
              <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={footerAddress}>
              ForjeGames Inc. · All rights reserved
            </Text>
            <Text style={footerAddress}>
              ForjeGames LLC · [PHYSICAL ADDRESS REQUIRED - UPDATE BEFORE LAUNCH] · United States
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default BuildCompleteEmail

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

const statusBanner: React.CSSProperties = {
  backgroundColor: '#0d2d1a',
  padding: '10px 40px',
  textAlign: 'center',
}

const statusDot: React.CSSProperties = {
  color: '#22c55e',
  fontSize: '10px',
  display: 'inline',
  margin: '0 6px 0 0',
}

const statusLabel: React.CSSProperties = {
  color: '#22c55e',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  display: 'inline',
  margin: '0',
}

const thumbnailSection: React.CSSProperties = {
  padding: '0',
}

const thumbnailImg: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  display: 'block',
  objectFit: 'cover',
}

const thumbnailPlaceholder: React.CSSProperties = {
  backgroundColor: '#0d1235',
  padding: '60px 40px',
  textAlign: 'center',
  borderBottom: '1px solid #1e2347',
}

const thumbnailPlaceholderIcon: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '48px',
  margin: '0 0 12px',
}

const thumbnailPlaceholderText: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '14px',
  margin: '0',
}

const contentSection: React.CSSProperties = {
  padding: '36px 40px 8px',
  textAlign: 'center',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
  textTransform: 'capitalize',
}

const buildNameLabel: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  margin: '0 0 16px',
}

const description: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
}

const actionsSection: React.CSSProperties = {
  padding: '24px 40px 12px',
  textAlign: 'center',
}

const secondaryActionsSection: React.CSSProperties = {
  padding: '0 40px 32px',
  textAlign: 'center',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: '#FFB81C',
  borderRadius: '8px',
  color: '#000000',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const secondaryButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #FFB81C',
  borderRadius: '8px',
  color: '#FFB81C',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 20px',
  textDecoration: 'none',
  display: 'inline-block',
}

const ghostButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #1e2347',
  borderRadius: '8px',
  color: '#8b92b8',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 20px',
  textDecoration: 'none',
  display: 'inline-block',
}

const tipsSection: React.CSSProperties = {
  padding: '24px 40px',
}

const tipsHeading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const tipItem: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const tipBullet: React.CSSProperties = {
  color: '#FFB81C',
  marginRight: '8px',
}

const footer: React.CSSProperties = {
  padding: '24px 40px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0 0 8px',
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
