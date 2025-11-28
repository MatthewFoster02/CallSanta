-- Update pricing: call $9.99 → $0.99, recording $4.99 → free
UPDATE pricing_config
SET base_price_cents = 99,
    recording_addon_cents = 0
WHERE name = 'default';
