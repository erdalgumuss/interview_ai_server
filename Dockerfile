FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

# FFMPEG KURULUMU
RUN apt-get update && apt-get install -y ffmpeg


COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
