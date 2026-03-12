# syntax=docker/dockerfile:1

FROM golang:1.23 AS builder
WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /markmind-api ./cmd/api

FROM debian:12-slim AS runner
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /usr/sbin/nologin markmind
COPY --from=builder /markmind-api /app/markmind-api
COPY --from=builder /app/migrations /app/migrations

USER markmind
EXPOSE 8080
CMD ["/app/markmind-api"]
