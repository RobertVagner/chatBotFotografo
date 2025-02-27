# Usando uma imagem do Node.js
FROM node:18

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos do projeto para o contêiner
COPY package.json package-lock.json ./

# Instalar as dependências
RUN npm install --production

# Copiar o restante dos arquivos para o contêiner
COPY . .

# Definir a porta que será usada pelo aplicativo
EXPOSE 3000

# Comando para iniciar o bot
CMD ["node", "chatbot.js"]