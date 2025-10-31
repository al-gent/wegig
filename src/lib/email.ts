import * as brevo from '@getbrevo/brevo'

const brevoApiKey = process.env.BREVO_API_KEY

if (!brevoApiKey) {
  console.warn('BREVO_API_KEY is not set. Email functionality will be disabled.')
}

export async function sendEmailViaBrevo(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: { email: string; name?: string }
}) {
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not configured')
  }

  const apiInstance = new brevo.TransactionalEmailsApi()
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey)
  
  const emailData = new brevo.SendSmtpEmail()
  emailData.sender = options.from || {
    name: 'weGig Team',
    email: process.env.BREVO_FROM_EMAIL || 'noreply@wegig.com'
  }
  emailData.to = Array.isArray(options.to) 
    ? options.to.map(email => ({ email }))
    : [{ email: options.to }]
  emailData.subject = options.subject
  emailData.htmlContent = options.html || options.text
  emailData.textContent = options.text

  try {
    const result = await apiInstance.sendTransacEmail(emailData)
    return result
  } catch (error) {
    console.error('Error sending email via Brevo:', error)
    throw error
  }
}

