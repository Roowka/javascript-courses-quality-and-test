# Étape 1 : Utiliser une image Node.js légère
FROM node:18-alpine

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Étape 3 : Copier uniquement les fichiers nécessaires pour l'installation des dépendances
COPY package.json package-lock.json ./

# Étape 4 : Installer les dépendances
RUN npm install --production

# Étape 5 : Copier tout le reste du projet dans le conteneur
COPY . .

# Étape 6 : Exposer le port utilisé par l'application
EXPOSE 3030

# Étape 7 : Définir la commande de démarrage
CMD ["node", "index.js"]
