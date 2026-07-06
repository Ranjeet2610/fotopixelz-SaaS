import { Button } from '@react-email/components'

type EmailButtonProps = {
  href: string
  label: string
}

export function EmailButton({ href, label }: EmailButtonProps) {
  return (
    <Button href={href} style={buttonStyle}>
      {label}
    </Button>
  )
}

const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '10px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: '48px',
  padding: '0 24px',
  textAlign: 'center' as const,
  textDecoration: 'none'
}
