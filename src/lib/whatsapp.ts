const getConfig = () => {
  const idInstance = process.env.GREEN_API_ID_INSTANCE
  const apiToken = process.env.GREEN_API_API_TOKEN
  const apiUrl = process.env.GREEN_API_URL || 'https://api.greenapi.com'
  return { idInstance, apiToken, apiUrl }
}

async function apiFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  let data: any = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  if (!response.ok && !data) {
    return { status: response.status, data: { message: `HTTP ${response.status}` } }
  }
  return { status: response.status, data }
}

export async function checkWhatsAppNumber(phone: string): Promise<{
  exists: boolean
  error?: string
}> {
  const { idInstance, apiToken, apiUrl } = getConfig()
  if (!idInstance || !apiToken) {
    return { exists: false, error: 'GreenAPI no configurado' }
  }

  try {
    const { status, data } = await apiFetch(
      `${apiUrl}/waInstance${idInstance}/checkWhatsapp/${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone.replace(/\D/g, '') }),
      }
    )
    if (status !== 200) {
      return { exists: false, error: data?.message || `Error de validación (HTTP ${status})` }
    }
    return { exists: !!data?.existsWhatsapp }
  } catch (error) {
    return { exists: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}

export async function sendWhatsApp(params: {
  to: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const { idInstance, apiToken, apiUrl } = getConfig()

  if (!idInstance || !apiToken) {
    return { success: false, error: 'GreenAPI no configurado' }
  }

  try {
    const { status, data } = await apiFetch(
      `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${params.to}@c.us`,
          message: params.message,
        }),
      }
    )

    if (status === 200 && data?.idMessage) return { success: true }

    if (status === 466) {
      const desc = data?.correspondentsStatus?.description
        || data?.invokeStatus?.description
        || 'Límite del plan GreenAPI alcanzado (solo 3 contactos/mes en el plan gratis). Cambia al plan Business o a 360dialog.'
      return { success: false, error: desc }
    }

    const message = data?.message || data?.details || data?.error || `HTTP ${status}`
    return { success: false, error: message }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error de red' }
  }
}
