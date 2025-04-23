# node base
FROM node:alpine

WORKDIR /app

COPY package*.json /app

# Install pnpm globally
RUN npm install

COPY . . 

# Build TypeScript files

EXPOSE 80

CMD [ "npm","run","dev" ]



# docker push wamahiu/skillmatch
# docker build -t wamahiu/skillmatch .