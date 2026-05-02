# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar restante do código e fazer o build estático
COPY . .
RUN npm run build

# Stage 2: Nginx para servir
FROM nginx:alpine

# Copiar build da etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar a configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
