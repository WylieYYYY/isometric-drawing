FROM node:24-bookworm-slim
RUN npm install --global playwright@1.56.1
RUN npx playwright install-deps
RUN npx playwright install firefox
