import { createClient, SupabaseClient } from 'supabase';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateCouponPayload {
  coupon_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_uses?: number | null;
  expires_at?: string | null; // ISO string
  min_purchase_amount?: number | null;
  is_active?: boolean;
  applicable_event_ids?: string[] | null; // For event-specific coupons
}

async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } , error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const SUPER_ADMIN_UID = Deno.env.get('SUPER_ADMIN_UID');
  if (SUPER_ADMIN_UID && user.id === SUPER_ADMIN_UID) return true;
  const { data: userRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return !!userRole;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error('Supabase env vars not set for update-coupon.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 
        });
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const adminCheck = await isAdmin(supabaseUserClient);
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin access required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 
      });
    }

    const payload: UpdateCouponPayload = await req.json();
    const { coupon_id, ...updateData } = payload;

    if (!coupon_id || !updateData.code || !updateData.discount_type || updateData.discount_value === undefined) {
      return new Response(JSON.stringify({ error: 'Invalid payload. coupon_id, code, discount_type, and discount_value are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }
    
    // Ensure discount_value is positive
    if (updateData.discount_value < 0) {
        return new Response(JSON.stringify({ error: 'Discount value cannot be negative.'}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        });
    }
    if (updateData.discount_type === 'percentage' && (updateData.discount_value < 0 || updateData.discount_value > 100)) {
         return new Response(JSON.stringify({ error: 'Percentage discount must be between 0 and 100.'}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        });
    }


    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: updatedCoupon, error: couponUpdateError } = await supabaseAdmin
      .from('coupons')
      .update({
        code: updateData.code,
        discount_type: updateData.discount_type,
        discount_value: updateData.discount_value,
        max_uses: updateData.max_uses,
        expires_at: updateData.expires_at,
        min_purchase_amount: updateData.min_purchase_amount,
        is_active: updateData.is_active,
        applicable_event_ids: updateData.applicable_event_ids,
        // times_used should not be updated here, it's managed by webhook
      })
      .eq('id', coupon_id)
      .select()
      .single();

    if (couponUpdateError) {
      console.error('Error updating coupon:', couponUpdateError);
      // Check for unique constraint violation on 'code'
      if (couponUpdateError.message.includes('duplicate key value violates unique constraint')) {
          return new Response(JSON.stringify({ error: `Coupon code "${updateData.code}" already exists.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 // Conflict
          });
      }
      return new Response(JSON.stringify({ error: 'Failed to update coupon.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }

    return new Response(JSON.stringify({ message: 'Coupon updated successfully.', coupon: updatedCoupon }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error) {
    console.error('Error in update-coupon function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
