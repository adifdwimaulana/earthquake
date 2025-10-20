FROM node:22-alpine

WORKDIR /cdk

# Install dependencies
COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENTRYPOINT ["npx", "cdklocal"]
