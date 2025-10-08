#!/bin/bash

# Configuration
DB_NAME="bystalindrive"
DB_USER="root"
# Dossier backups existant
BACKUP_DIR="./backups"          
DATE=$(date +%F)

# Nom du fichier de sauvegarde
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# Exécution de la sauvegarde
mysqldump -u "$DB_USER" -p "$DB_NAME" | gzip > "$BACKUP_FILE"

# Message de confirmation
echo "✅ Sauvegarde de la base $DB_NAME terminée : $BACKUP_FILE"