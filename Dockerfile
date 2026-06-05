# ─── Autor: Barclay Leach ────────────────────────────────────────────────────
# Coderhouse - Programación Backend III: Testing y Escalabilidad Flex
#
# Imagen optimizada de AdoptMe API.
# Decisiones de optimización:
#   - node:20-alpine: imagen LTS más liviana (~50MB vs ~300MB de node:20)
#   - WORKDIR /app: directorio de trabajo aislado del sistema de archivos base
#   - Copia package*.json primero: aprovecha la caché de capas de Docker.
#     Si el código cambia pero no las dependencias, npm ci no se re-ejecuta.
#   - npm ci --only=production: instalación determinista sin devDependencies
#   - npm cache clean --force: elimina la caché de npm en la misma capa
#     para reducir el tamaño final de la imagen
#   - USER node: corre el proceso como usuario sin privilegios (seguridad)
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos antes que el código fuente (cache de capas)
COPY package*.json ./

# Instalar solo dependencias de producción y limpiar caché en una sola capa
RUN npm ci --only=production && npm cache clean --force

# Copiar el código fuente de la aplicación
COPY src ./src

# Variables de entorno con valores por defecto
ENV PORT=8080
ENV NODE_ENV=production

# Exponer el puerto de la aplicación
EXPOSE 8080

# Correr como usuario sin privilegios
USER node

# Comando de inicio
CMD ["node", "src/server.js"]
