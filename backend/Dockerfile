# Use the official Node.js 21.7.3 image from the Docker Hub
FROM node:21.7.3-alpine

# Set the working directory in the container
WORKDIR /server

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the app runs on
EXPOSE 5001

# Run the application
CMD ["node", "server.js"]