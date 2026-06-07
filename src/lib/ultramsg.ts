export async function sendWhatsApp(params: {
  to: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID
  const token = process.env.ULTRAMSG_TOKEN

  if (!instanceId || !token) {
    return { success: false, error: 'UltraMsg no configurado' }
  }

  try {
    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        to: params.to,
        body: params.message,
      }),
    })

    const data = await response.json()
    if (data.sent) return { success: true }
    return { success: false, error: data.error || 'Error desconocido' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}
