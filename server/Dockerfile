FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY .env.example ./.env.example
EXPOSE 4000
CMD ["npm", "run", "start"]
