FROM node:20-alpine

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# If you have package-lock.json, keep npm ci; otherwise switch to npm install
# RUN npm ci --only=production
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --omit=dev; fi

# Copy the app code
COPY . .

# Make sure Node knows it's production
ENV NODE_ENV=production

# Railway injects PORT; ensure your code uses process.env.PORT
# EXPOSE is optional on Railway, but harmless
EXPOSE 4000

# Start (server/package.json must have: "start": "node src/index.js")
CMD ["npm", "start"]