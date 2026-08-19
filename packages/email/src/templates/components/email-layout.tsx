import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text
} from '@react-email/components'
import type { ReactNode } from 'react'
import type { EmailBrandConfig } from '../../types'
import { EmailFooter } from './email-footer'

type EmailLayoutProps = {
  brand: EmailBrandConfig
  preview: string
  title: string
  children: ReactNode
}

export function EmailLayout({ brand, preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            {brand.logoUrl ? (
              <Img src={brand.logoUrl} alt={brand.appName} height="28" style={logoStyle} />
            ) : (
              <Text style={wordmarkStyle}>{brand.appName}</Text>
            )}
          </Section>

          <Section style={cardStyle}>
            <Heading style={headingStyle}>{title}</Heading>
            {children}
          </Section>

          <EmailFooter brand={brand} />
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: '#f4f4f5',
  color: '#18181b',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 12px'
}

const containerStyle = {
  margin: '0 auto',
  maxWidth: '560px'
}

const headerStyle = {
  padding: '8px 4px 20px'
}

const wordmarkStyle = {
  color: '#18181b',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: 0
}

const logoStyle = {
  display: 'block'
}

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '12px',
  padding: '32px 28px'
}

const headingStyle = {
  color: '#18181b',
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: '28px',
  margin: '0 0 16px'
}
