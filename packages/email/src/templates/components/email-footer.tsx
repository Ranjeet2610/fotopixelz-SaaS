import React from 'react'
import { Link, Section, Text } from '@react-email/components'
import type { EmailBrandConfig } from '../../types'

type EmailFooterProps = {
  brand: EmailBrandConfig
}

export function EmailFooter({ brand }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Text style={footerTextStyle}>
        © {brand.copyrightYear} {brand.appName}. All rights reserved.
      </Text>
      <Text style={footerTextStyle}>
        Need help?{' '}
        <Link href={`mailto:${brand.supportEmail}`} style={linkStyle}>
          {brand.supportEmail}
        </Link>
      </Text>
    </Section>
  )
}

const footerStyle = {
  padding: '24px 4px 8px'
}

const footerTextStyle = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px'
}

const linkStyle = {
  color: '#52525b',
  textDecoration: 'underline'
}
