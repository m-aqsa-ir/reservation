
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN apk add --no-cache openssl libc6-compat
RUN npm config set proxy http://10.212.192.1:34650
RUN npm config set https-proxy http://10.212.192.1:34650
RUN npm config set registry https://registry.npmjs.org/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Run migrations (before build)
#RUN npx prisma migrate deploy

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
