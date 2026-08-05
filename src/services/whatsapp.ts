import { Alert, Linking } from 'react-native';

export async function openWhatsApp(phone: string, message = 'Olá! Vi sua indicação no Vizinho Indica.') {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
  const webUrls = [
    `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
    `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
  ];

  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // Ignore and try the web fallbacks below.
  }

  for (const webUrl of webUrls) {
    try {
      await Linking.openURL(webUrl);
      return;
    } catch {
      // Try the next fallback URL.
    }
  }

  Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o WhatsApp neste aparelho.');
}
