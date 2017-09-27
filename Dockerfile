FROM node:8

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install && npm install rimraf && npm install --save-dev babel-cli

CMD ["npm","start"]
