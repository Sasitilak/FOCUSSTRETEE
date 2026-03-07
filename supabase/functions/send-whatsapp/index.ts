import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')

serve(async (req) => {
    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
        return new Response(JSON.stringify({ error: "Missing WhatsApp credentials" }), { status: 500 })
    }

    try {
        const { booking, template, phone, message: customText, locationText } = await req.json();

        let whatsappPayload;

        if (phone && customText) {
            console.log(`Sending Broadcast/Custom to ${phone}`);
            whatsappPayload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: template || "custom_alert",
                    language: { code: "en_US" },
                    components: [{
                        type: "body",
                        parameters: [{ type: "text", text: customText }]
                    }]
                }
            };
        } else if (booking) {
            const customerPhone = phone || booking.customer_phone;
            const templateName = template || (booking.status === 'confirmed' ? 'booking_confirmed' : 'booking_pending');
            const locText = locationText || "AcumenHive Spot";

            console.log(`Sending ${templateName} to ${customerPhone}`);

            const bodyParams: any[] = [];

            // Named Parameter Mapping for Meta Templates (Better for Utility Approval)
            if (templateName === 'booking_confirmed') {
                bodyParams.push({ type: "text", parameter_name: "name", text: booking.customer_name });
                bodyParams.push({ type: "text", parameter_name: "location", text: locText });
                bodyParams.push({ type: "text", parameter_name: "booking_id", text: booking.id });
                bodyParams.push({ type: "text", parameter_name: "amount", text: booking.amount.toString() });
            } else if (templateName === 'booking_pending' || templateName === 'booking_rejected' || templateName === 'admin_booking_alert') {
                bodyParams.push({ type: "text", parameter_name: "name", text: booking.customer_name });
                bodyParams.push({ type: "text", parameter_name: "location", text: locText });
                bodyParams.push({ type: "text", parameter_name: "booking_id", text: booking.id });
            } else {
                // Fallback for custom or positional templates
                bodyParams.push({ type: "text", text: booking.customer_name });
                bodyParams.push({ type: "text", text: booking.id });
                bodyParams.push({ type: "text", text: booking.start_date });
                bodyParams.push({ type: "text", text: booking.amount.toString() });
            }

            whatsappPayload = {
                messaging_product: "whatsapp",
                to: customerPhone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en_US" },
                    components: [{
                        type: "body",
                        parameters: bodyParams
                    }]
                }
            };
        } else {
            throw new Error("Invalid request: Missing booking or broadcast data");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(
                `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(whatsappPayload),
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("WhatsApp API Error:", response.status, errorBody);
                return new Response(JSON.stringify({ error: "Upstream WhatsApp API Error", details: errorBody }), {
                    status: response.status,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const data = await response.json()
            console.log("WhatsApp API Response:", data);

            return new Response(JSON.stringify(data), {
                headers: { "Content-Type": "application/json" },
            })
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }
})
