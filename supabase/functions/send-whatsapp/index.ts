import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')

serve(async (req) => {
    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
        return new Response(JSON.stringify({ error: "Missing WhatsApp credentials" }), { status: 500 })
    }

    try {
        const { booking, template, phone, message: customText } = await req.json();

        let whatsappPayload;

        if (phone && customText) {
            console.log(`Sending Broadcast to ${phone}`);
            // Broadcast Mode (using a generic 'announcement' template with 1 variable, or fallback to text)
            // Note: For production, you must use a pre-approved template for business-initiated messages.
            // We serve a structure that uses a generic 'custom_alert' template assuming it takes 1 text parameter.
            whatsappPayload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: "custom_alert", // You would create this in Meta Manager
                    language: { code: "en_US" },
                    components: [{
                        type: "body",
                        parameters: [{ type: "text", text: customText }]
                    }]
                }
            };
        } else if (booking) {
            console.log(`Sending Booking Confirmation to ${booking.customer_phone}`);
            // Booking Mode
            whatsappPayload = {
                messaging_product: "whatsapp",
                to: booking.customer_phone,
                type: "template",
                template: {
                    name: template || "booking_confirmation",
                    language: { code: "en_US" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: booking.customer_name },
                                { type: "text", text: booking.id },
                                { type: "text", text: booking.start_date },
                                { type: "text", text: booking.amount.toString() }
                            ]
                        }
                    ]
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
