FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Allow Cloud Run to set PORT by dynamically generating the listen directive if needed
# Cloud Run sets the PORT env variable. 
# We configure nginx to listen on 8080 above, which matches the default Cloud Run port.
# If Cloud run sends PORT, we start nginx with a small script to substitute default port
CMD sed -i -e 's/8080/'"$PORT"'/g' /etc/nginx/nginx.conf && nginx -g 'daemon off;'
