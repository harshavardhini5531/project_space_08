import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    var body = await request.json()
    var { rollNumber, otp } = body
    var roll = (rollNumber || "").trim().toUpperCase()

    if (!roll || !otp) {
      return Response.json({ error: "Roll number and OTP are required" }, { status: 400 })
    }

    /* Find the most recent unused OTP for this roll */
    var { data: otpRecord, error: otpErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("roll_number", roll)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (otpErr || !otpRecord) {
      return Response.json({ error: "No valid OTP found. Please request a new one." }, { status: 400 })
    }

    /* Check expiry */
    if (new Date(otpRecord.expires_at) < new Date()) {
      return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
    }

    /* Check match */
    if (otpRecord.otp !== otp.trim()) {
      return Response.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
    }

    /* Mark as used */
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id)

    return Response.json({
      success: true,
      message: "OTP verified successfully!"
    })

  } catch (error) {
    console.error("Verify OTP Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
