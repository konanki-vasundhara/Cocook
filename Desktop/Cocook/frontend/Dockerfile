# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Vite app
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

# Expose frontend port
EXPOSE 3000

# Start frontend application
CMD ["serve", "-s", "dist", "-l", "3000"]
