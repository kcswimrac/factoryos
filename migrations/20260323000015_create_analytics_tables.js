module.exports = {
  name: 'create_analytics_tables',
  up: async (conn) => {
    // Page views — one row per server-side page hit
    await conn.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        referrer VARCHAR(2000),
        user_agent VARCHAR(1000),
        ip_hash VARCHAR(64),
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`CREATE INDEX idx_page_views_created_at ON page_views (created_at)`).catch(() => {});
    await conn.query(`CREATE INDEX idx_page_views_path ON page_views (path)`).catch(() => {});
    await conn.query(`CREATE INDEX idx_page_views_utm_source ON page_views (utm_source)`).catch(() => {});

    // Analytics events — demo engagement, conversions, etc.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        event_data JSON,
        path VARCHAR(500),
        ip_hash VARCHAR(64),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`CREATE INDEX idx_analytics_events_name ON analytics_events (event_name)`).catch(() => {});
    await conn.query(`CREATE INDEX idx_analytics_events_created_at ON analytics_events (created_at)`).catch(() => {});
  }
};
