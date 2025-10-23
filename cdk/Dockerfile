FROM node:22-alpine AS builder

WORKDIR /cdk
COPY package*.json ./
RUN npm install

FROM node:22-alpine

WORKDIR /cdk
COPY --from=builder /cdk/node_modules ./node_modules
COPY . .

RUN chmod +x /cdk/init-script.sh

ENTRYPOINT ["/cdk/init-script.sh"]
