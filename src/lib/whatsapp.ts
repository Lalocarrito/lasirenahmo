export async function sendWhatsApp(params: {
  to: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const idInstance = process.env.GREEN_API_ID_INSTANCE
  const apiToken = process.env.GREEN_API_API_TOKEN

  if (!idInstance || !apiToken) {
    return { success: false, error: 'GreenAPI no configurado' }
  }

  try {
    const response = await fetch(
      `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${params.to}@c.us`,
          message: params.message,
        }),
      }
    )

    const data = await response.json()

    if (data.idMessage) return { success: true }
    return { success: false, error: data.message || data.details || 'Error desconocido' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}
