FROM alpine:latest

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN addgroup -g $USER_GID $USERNAME && \
    adduser -D -u $USER_UID -G $USERNAME $USERNAME
RUN apk update && apk upgrade
RUN apk add nodejs yarn git

USER $USERNAME
