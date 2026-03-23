module.exports = {
  name: 'create_analytics_tables',
  up: async (client) => {
    // Page views — one row per server-side page hit
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        referrer VARCHAR(2000),
        user_agent VARCHAR(1000),
        ip_hash VARCHAR(64),
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON page_views (utm_source)`);

    // Analytics events — demo engagement, conversions, etc.
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        event_data JSONB,
        path VARCHAR(500),
        ip_hash VARCHAR(64),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events (event_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at)`);
  }
};
