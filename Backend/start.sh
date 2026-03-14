#!/bin/sh
echo "--- CoreInventory Startup Sequence ---"

# Attempt to run migrations. 
# The run.js script already has a testConnection check.
# We loop until the database is truly ready to accept the schema.
until node src/migrations/run.js; do
  echo "Database not ready yet... waiting 5 seconds."
  sleep 5
done

echo "Database schema verified/updated."

# Run seed data (idempotent ON CONFLICT logic)
node src/migrations/seed.js

echo "Initial data seeding complete."

# Launch the API
echo "Starting Express Server..."
npm start
