import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Initialize Supabase Client (Service Role needed for deletions)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 2. Find confirmed bookings older than 3 days that still have a screenshot
    // Using raw SQL query via rpc if possible, or simple select/filter
    // We'll calculate the date 3 days ago.
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: oldBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, payment_screenshot_url')
      .eq('status', 'confirmed')
      .neq('payment_screenshot_url', null)
      .lt('updated_at', threeDaysAgo.toISOString())

    if (fetchError) throw fetchError;
    if (!oldBookings || oldBookings.length === 0) {
      return new Response(JSON.stringify({ message: "No old screenshots found to cleanup." }), { headers: { "Content-Type": "application/json" } });
    }

    console.log(`Found ${oldBookings.length} bookings to cleanup.`);
    const pathsToDelete: string[] = [];
    const bookingIdsToUpdate: string[] = [];

    // 3. Extract file paths
    // URL format: .../storage/v1/object/public/payment_uploads/folder/file.jpg
    // We need just: folder/file.jpg
    for (const b of oldBookings) {
      if (!b.payment_screenshot_url) continue;

      try {
        const url = new URL(b.payment_screenshot_url);
        // The path usually ends with /payment_uploads/...
        // A simple splits approach:
        const parts = url.pathname.split('/payment_uploads/');
        if (parts.length > 1) {
          // Decode generic URL encoding if present
          const cleanPath = decodeURIComponent(parts[1]);
          pathsToDelete.push(cleanPath);
          bookingIdsToUpdate.push(b.id);
        }
      } catch (e) {
        console.error(`Failed to parse URL for booking ${b.id}:`, e);
      }
    }

    if (bookingIdsToUpdate.length > 0) {
      // 4. Update Database to NULL (First, to prevent broken links if deletion succeeds but update fails)
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ payment_screenshot_url: null })
        .in('id', bookingIdsToUpdate)

      if (updateError) throw updateError;

      // 5. Delete from Storage (Second)
      const { error: deleteError } = await supabase
        .storage
        .from('payment_uploads')
        .remove(pathsToDelete);

      if (deleteError) {
        console.error("Storage deletion failed after DB update", deleteError);
        // We log it but maybe we shouldn't fail the request completely since DB is clean?
        // But for transparency we throw.
        throw deleteError;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Cleaned up ${bookingIdsToUpdate.length} screenshots via Edge Function.`,
        deletedPaths: pathsToDelete
      }),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
