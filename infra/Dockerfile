FROM hashicorp/terraform:latest

ARG TFLINT_VERSION=v0.59.1

RUN apk add --no-cache aws-cli bash curl helm python3 py3-pip unzip && \
    pip3 install --break-system-packages --no-cache-dir checkov && \
    arch="$(uname -m)" && \
    case "$arch" in \
      aarch64) tflint_arch="arm64" ;; \
      x86_64) tflint_arch="amd64" ;; \
      *) echo "unsupported architecture: $arch" >&2; exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/terraform-linters/tflint/releases/download/${TFLINT_VERSION}/tflint_linux_${tflint_arch}.zip" -o /tmp/tflint.zip && \
    unzip /tmp/tflint.zip -d /usr/local/bin && \
    rm /tmp/tflint.zip && \
    tflint --version && \
    checkov --version

WORKDIR /workspace
