import { Alert, Linking } from 'react-native';

export async function openWhatsApp(phone: string, message = 'Olá! Vi sua indicação no Vizinho Indica.') {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }
  const canOpenWeb = await Linking.canOpenURL(webUrl);
  if (canOpenWeb) {
    await Linking.openURL(webUrl);
    return;
  }
  Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o WhatsApp neste aparelho.');
}
