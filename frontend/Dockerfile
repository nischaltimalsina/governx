FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Next.js runs on port 3000 by default
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]
