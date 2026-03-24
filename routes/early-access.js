const express = require('express');
const router = express.Router();

/**
 * POST /api/early-access
 * Store early access signup requests
 */
router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const {
    name,
    role,
    phone,
    email,
    organization,
    teamName,
    secondaryName,
    secondaryRole,
    secondaryEmail,
    voucherCode
  } = req.body;

  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  try {
    // Check if voucher code is provided and valid
    let voucherValid = false;
    let voucherId = null;

    if (voucherCode && voucherCode.trim()) {
      // Check if voucher exists in university_vouchers table
      const [vouchers] = await pool.query(
        'SELECT id FROM university_vouchers WHERE voucher_code = ? AND claimed_at IS NULL',
        [voucherCode.trim()]
      );

      if (vouchers.length > 0) {
        voucherValid = true;
        voucherId = vouchers[0].id;
      }
    }

    if (voucherValid) {
      // Update the university_vouchers record with contact info
      await pool.query(
        `UPDATE university_vouchers SET
          contact_name = ?,
          contact_role = ?,
          contact_phone = ?,
          contact_email = ?,
          organization = ?,
          team_name = ?,
          secondary_name = ?,
          secondary_role = ?,
          secondary_email = ?,
          claimed_at = NOW()
        WHERE id = ?`,
        [
          name,
          role || null,
          phone || null,
          email,
          organization || null,
          teamName || null,
          secondaryName || null,
          secondaryRole || null,
          secondaryEmail || null,
          voucherId
        ]
      );

      return res.json({
        success: true,
        message: 'Voucher verified! Your early access has been activated.',
        voucherValid: true
      });
    } else {
      // Insert into access_request table
      await pool.query(
        `INSERT INTO access_requests (
          name,
          role,
          phone,
          email,
          organization,
          team_name,
          secondary_name,
          secondary_role,
          secondary_email,
          voucher_code_attempted,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          name,
          role || null,
          phone || null,
          email,
          organization || null,
          teamName || null,
          secondaryName || null,
          secondaryRole || null,
          secondaryEmail || null,
          voucherCode || null
        ]
      );

      return res.json({
        success: true,
        message: voucherCode
          ? 'Voucher code not recognized, but your request has been submitted. We\'ll be in touch!'
          : 'Thanks! Your early access request has been submitted. We\'ll be in touch!',
        voucherValid: false
      });
    }
  } catch (error) {
    console.error('[Early Access] submission error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request. Please try again.'
    });
  }
});

module.exports = router;
