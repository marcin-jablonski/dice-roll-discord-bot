FROM node:13.12.0

COPY src /src/dice-roll

WORKDIR /src/dice-roll

RUN npm install

ENTRYPOINT ["node", "app.js"]