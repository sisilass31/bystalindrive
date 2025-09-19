#!/bin/bash

# -----------------------------
# Configuration
# -----------------------------
DB_NAME="bystalindrive"
DB_USER="root"
BACKUP_DIR="./backups"          # Crée un dossier backups à la racine du backend
DATE=$(date +%F)

# -----------------------------
# Préparation du dossier de backup
# -----------------------------
mkdir -p "$BACKUP_DIR"

# -----------------------------
# Nom du fichier de sauvegarde
# -----------------------------
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# -----------------------------
# Exécution de la sauvegarde
# -----------------------------
mysqldump -u "$DB_USER" -p "$DB_NAME" | gzip > "$BACKUP_FILE"

# -----------------------------
# Message de confirmation
# -----------------------------
echo "✅ Sauvegarde de la base $DB_NAME terminée : $BACKUP_FILE"