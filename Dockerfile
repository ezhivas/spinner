# Use Node.js 20 LTS for better performance and compatibility
FROM node:20

# Install lsof to use in start:dev
RUN apt-get update && apt-get install -y lsof

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with production flag for smaller image)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
