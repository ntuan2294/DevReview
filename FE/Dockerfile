# Dockerfile (FE)
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Serve with a simple HTTP server
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
