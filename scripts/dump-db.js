#!/usr/bin/env node
/**
 * FactoryOS Database Dump Script
 * Generates a SQL dump (schema + data) for all tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_UYVqxasn7S4B@ep-rough-art-ajhvb54d.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: DATABASE_URL });

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function getTables() {
  const result = await query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return result.rows.map(r => r.tablename);
}

async function getTableDDL(tableName) {
  // Get column definitions
  const cols = await query(`
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      column_default,
      is_nullable,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  // Get constraints
  const constraints = await query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = $1
    ORDER BY tc.constraint_type, tc.constraint_name
  `, [tableName]);

  // Get indexes
  const indexes = await query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1
    AND indexname NOT LIKE '%_pkey'
    ORDER BY indexname
  `, [tableName]);

  let ddl = `-- Table: ${tableName}\n`;
  ddl += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

  const colDefs = cols.rows.map(col => {
    let colDef = `  "${col.column_name}" `;

    if (col.column_default && col.column_default.startsWith('nextval')) {
      if (col.data_type === 'bigint') colDef += 'BIGSERIAL';
      else colDef += 'SERIAL';
    } else if (col.udt_name === 'uuid' || col.data_type === 'uuid') {
      colDef += 'UUID';
    } else if (col.data_type === 'character varying') {
      colDef += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'TEXT';
    } else if (col.data_type === 'character') {
      colDef += `CHAR(${col.character_maximum_length || 1})`;
    } else if (col.data_type === 'timestamp without time zone') {
      colDef += 'TIMESTAMP';
    } else if (col.data_type === 'timestamp with time zone') {
      colDef += 'TIMESTAMPTZ';
    } else if (col.data_type === 'USER-DEFINED') {
      // Try to get enum values
      colDef += col.udt_name.toUpperCase();
    } else {
      colDef += col.data_type.toUpperCase();
    }

    if (col.is_nullable === 'NO' && !(col.column_default && col.column_default.startsWith('nextval'))) {
      colDef += ' NOT NULL';
    }

    if (col.column_default && !col.column_default.startsWith('nextval')) {
      colDef += ` DEFAULT ${col.column_default}`;
    }

    return colDef;
  });

  // Add primary key constraints
  const pkConstraints = constraints.rows.filter(c => c.constraint_type === 'PRIMARY KEY');
  const uniqueConstraints = constraints.rows.filter(c => c.constraint_type === 'UNIQUE');

  if (pkConstraints.length > 0) {
    const pkCols = pkConstraints.map(c => `"${c.column_name}"`).join(', ');
    colDefs.push(`  PRIMARY KEY (${pkCols})`);
  }

  uniqueConstraints.forEach(uc => {
    colDefs.push(`  UNIQUE ("${uc.column_name}")`);
  });

  ddl += colDefs.join(',\n');
  ddl += '\n);\n';

  // Add FK constraints separately
  const fkConstraints = constraints.rows.filter(c => c.constraint_type === 'FOREIGN KEY');
  fkConstraints.forEach(fk => {
    ddl += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`;
    if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') {
      ddl += ` ON DELETE ${fk.delete_rule}`;
    }
    ddl += ';\n';
  });

  // Add indexes
  indexes.rows.forEach(idx => {
    ddl += `${idx.indexdef};\n`;
  });

  return ddl;
}

async function getTableData(tableName) {
  const result = await query(`SELECT * FROM "${tableName}" ORDER BY 1`);
  if (result.rows.length === 0) return `-- No data in ${tableName}\n`;

  const cols = result.fields.map(f => `"${f.name}"`).join(', ');
  let inserts = `-- Data for table: ${tableName} (${result.rows.length} rows)\n`;

  for (const row of result.rows) {
    const vals = result.fields.map(f => escapeSqlValue(row[f.name])).join(', ');
    inserts += `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
  }

  return inserts;
}

async function getEnumTypes() {
  const result = await query(`
    SELECT t.typname, e.enumlabel, e.enumsortorder
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);

  if (result.rows.length === 0) return '';

  const enums = {};
  result.rows.forEach(row => {
    if (!enums[row.typname]) enums[row.typname] = [];
    enums[row.typname].push(row.enumlabel);
  });

  let ddl = '-- Custom ENUM Types\n';
  Object.entries(enums).forEach(([name, values]) => {
    ddl += `CREATE TYPE IF NOT EXISTS "${name}" AS ENUM (${values.map(v => `'${v}'`).join(', ')});\n`;
  });
  return ddl + '\n';
}

async function main() {
  console.log('Connecting to database...');

  // Test connection
  await query('SELECT 1');
  console.log('Connected successfully.');

  const outputFile = path.join(__dirname, '../db/factoryos_dump.sql');
  const dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let sql = '';

  // Header
  sql += `-- FactoryOS Database Dump\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Database: Neon PostgreSQL\n`;
  sql += `-- \n`;
  sql += `-- How to restore:\n`;
  sql += `--   psql <target_database_url> < factoryos_dump.sql\n\n`;

  sql += `SET client_encoding = 'UTF8';\n`;
  sql += `SET standard_conforming_strings = on;\n\n`;

  // Enum types
  console.log('Dumping enum types...');
  sql += await getEnumTypes();

  // Schema
  const tables = await getTables();
  console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);

  sql += `-- ============================================================\n`;
  sql += `-- SCHEMA\n`;
  sql += `-- ============================================================\n\n`;

  for (const table of tables) {
    console.log(`  Schema: ${table}`);
    sql += await getTableDDL(table);
    sql += '\n';
  }

  // Data
  sql += `-- ============================================================\n`;
  sql += `-- DATA\n`;
  sql += `-- ============================================================\n\n`;

  for (const table of tables) {
    console.log(`  Data: ${table}`);
    sql += await getTableData(table);
    sql += '\n';
  }

  fs.writeFileSync(outputFile, sql);
  const stats = fs.statSync(outputFile);
  console.log(`\nDump complete: ${outputFile}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);

  await pool.end();
}

main().catch(err => {
  console.error('Dump failed:', err.message);
  process.exit(1);
});
