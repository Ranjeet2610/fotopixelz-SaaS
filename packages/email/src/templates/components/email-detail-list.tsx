import React from 'react'
import { Row, Section, Text } from '@react-email/components'

export type EmailDetailItem = {
  label: string
  value: string
}

type EmailDetailListProps = {
  items: EmailDetailItem[]
}

export function EmailDetailList({ items }: EmailDetailListProps) {
  return (
    <Section style={containerStyle}>
      {items.map((item) => (
        <Row key={item.label} style={rowStyle}>
          <Text style={labelStyle}>{item.label}</Text>
          <Text style={valueStyle}>{item.value}</Text>
        </Row>
      ))}
    </Section>
  )
}

const containerStyle = {
  backgroundColor: '#f4f4f5',
  borderRadius: '10px',
  margin: '4px 0 20px',
  padding: '4px 16px'
}

const rowStyle = {
  padding: '10px 0'
}

const labelStyle = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 2px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em'
}

const valueStyle = {
  color: '#18181b',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: '20px',
  margin: 0
}
