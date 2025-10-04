FROM node:18-alpine

# Dossier de travail
WORKDIR /app

# Copier package.json et installer dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Variables d'environnement par défaut
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Lancer l'app
CMD ["npm", "start"]