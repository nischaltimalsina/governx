FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# API server will run on port 4000
EXPOSE 4000

# Command to run the application
CMD ["npm", "run", "dev"]
