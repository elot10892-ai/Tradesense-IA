import sqlite3

# Chemin de ta DB locale
db_path = "instance/trading_platform_dev.db"
# Nom du fichier SQL de sortie
backup_file = "backup.sql"

# Connexion à la DB
conn = sqlite3.connect(db_path)

with open(backup_file, "w", encoding="utf-8") as f:
    for line in conn.iterdump():
        f.write(f"{line}\n")

conn.close()
print(f"Backup créé avec succès : {backup_file}")
