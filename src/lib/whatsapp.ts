
import type { WhatsappMessageTemplate } from '@/lib/types';

/**
 * Sends a message via a configured WhatsApp API.
 * @param template The message template object.
 * @param placeholders A key-value object of placeholders to replace in the message text.
 * @param phone The recipient's phone number.
 */
export async function sendWhatsappMessage(
    template: WhatsappMessageTemplate,
    placeholders: Record<string, string>,
    phone: string,
) {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
        console.error("Número de telefone inválido para envio via WhatsApp:", phone);
        return;
    }

    let messageText = template.text;
    for (const key in placeholders) {
        messageText = messageText.replace(`{${key}}`, placeholders[key]);
    }

    const payload = {
        chatId: `55${cleanedPhone}@c.us`,
        reply_to: null,
        text: messageText,
        linkPreview: true,
        linkPreviewHighQuality: false,
        session: template.sessionName,
    };

    try {
        const response = await fetch(template.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Falha ao enviar mensagem do WhatsApp. Status: ${response.status}. Body: ${errorBody}`);
        }
        console.log("Mensagem do WhatsApp enviada com sucesso para o telefone:", cleanedPhone);
    } catch (error) {
        console.error("Erro ao enviar mensagem do WhatsApp:", error);
        // We log the error but don't re-throw it to avoid blocking user-facing flows.
    }
}
