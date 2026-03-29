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
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface SaleNotificationEmailProps {
  templateName: string
  saleAmount: number
  platformFee?: number
  netEarnings?: number
  monthlyTotal?: number
  salesThisMonth?: number
  earningsUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ForjeGames.com'

export const SaleNotificationEmail = ({
  templateName = 'My Template',
  saleAmount = 4.99,
  platformFee = 0.5,
  netEarnings,
  monthlyTotal = 24.50,
  salesThisMonth = 6,
  earningsUrl = `${baseUrl}/dashboard/earnings`,
}: SaleNotificationEmailProps) => {
  const calculatedNet = netEarnings ?? saleAmount - platformFee

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>
        {formatCurrency(calculatedNet)} earned from &quot;{templateName}&quot; — cha-ching!
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoSection}>
            <Text style={logoText}>
              <span style={logoSpan}>Roblox</span>
              <span style={logoGold}>Forge</span>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Sale Badge */}
          <Section style={saleBanner}>
            <Text style={saleLabel}>SALE</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={heading}>You made a sale!</Heading>
            <Text style={subheading}>
              Someone just purchased your template
            </Text>
          </Section>

          {/* Sale Card */}
          <Section style={saleCard}>
            <Text style={saleTemplateName}>&quot;{templateName}&quot;</Text>
            <Text style={saleBuyerLabel}>
              <span style={buyerIcon}>&#128100;</span> Anonymous buyer
            </Text>

            <Hr style={cardDivider} />

            <Row>
              <Column style={earningsRow}>
                <Text style={earningsLabel}>Sale price</Text>
                <Text style={earningsValue}>{formatCurrency(saleAmount)}</Text>
              </Column>
              <Column style={earningsRow}>
                <Text style={earningsLabel}>Platform fee</Text>
                <Text style={earningsValueMuted}>-{formatCurrency(platformFee)}</Text>
              </Column>
            </Row>

            <Hr style={cardDivider} />

            <Row>
              <Column style={netRow}>
                <Text style={netLabel}>Your earnings</Text>
                <Text style={netValue}>{formatCurrency(calculatedNet)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Monthly Total */}
          <Section style={monthlySection}>
            <Row>
              <Column style={statBox}>
                <Text style={statValue}>{formatCurrency(monthlyTotal)}</Text>
                <Text style={statLabel}>Earned this month</Text>
              </Column>
              <Column style={statDivider} />
              <Column style={statBox}>
                <Text style={statValue}>{salesThisMonth}</Text>
                <Text style={statLabel}>Sales this month</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={earningsUrl}>
              View Earnings
            </Button>
          </Section>

          {/* Tip */}
          <Section style={tipSection}>
            <Text style={tipText}>
              <span style={tipIcon}>&#128161;</span>
              Templates with higher ratings sell 3x more. Ask buyers to leave a review!
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
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SaleNotificationEmail

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

const saleBanner: React.CSSProperties = {
  backgroundColor: '#1a2d0a',
  borderBottom: '1px solid #22c55e33',
  padding: '10px 40px',
  textAlign: 'center',
}

const saleLabel: React.CSSProperties = {
  color: '#22c55e',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '3px',
  margin: '0',
}

const contentSection: React.CSSProperties = {
  padding: '36px 40px 8px',
  textAlign: 'center',
}

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
}

const subheading: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '15px',
  margin: '0',
}

const saleCard: React.CSSProperties = {
  margin: '24px 40px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '16px',
  padding: '24px',
}

const saleTemplateName: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 6px',
}

const saleBuyerLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '13px',
  margin: '0 0 4px',
}

const buyerIcon: React.CSSProperties = {
  marginRight: '6px',
}

const cardDivider: React.CSSProperties = {
  borderColor: '#1e2347',
  margin: '16px 0',
}

const earningsRow: React.CSSProperties = {
  textAlign: 'left',
}

const earningsLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
}

const earningsValue: React.CSSProperties = {
  color: '#c5cbe8',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
}

const earningsValueMuted: React.CSSProperties = {
  color: '#6b74a8',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
}

const netRow: React.CSSProperties = {
  textAlign: 'left',
}

const netLabel: React.CSSProperties = {
  color: '#4a5180',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
}

const netValue: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
}

const monthlySection: React.CSSProperties = {
  margin: '0 40px 24px',
  backgroundColor: '#FFB81C0d',
  border: '1px solid #FFB81C22',
  borderRadius: '12px',
  padding: '20px 24px',
}

const statBox: React.CSSProperties = {
  textAlign: 'center',
  padding: '0 12px',
}

const statDivider: React.CSSProperties = {
  borderLeft: '1px solid #1e2347',
  width: '1px',
}

const statValue: React.CSSProperties = {
  color: '#FFB81C',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 4px',
}

const statLabel: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '12px',
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  padding: '0 40px 24px',
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

const tipSection: React.CSSProperties = {
  margin: '0 40px 32px',
  backgroundColor: '#0d1235',
  border: '1px solid #1e2347',
  borderRadius: '10px',
  padding: '14px 20px',
}

const tipText: React.CSSProperties = {
  color: '#8b92b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}

const tipIcon: React.CSSProperties = {
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
