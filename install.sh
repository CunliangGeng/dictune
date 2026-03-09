#!/bin/bash
# Dictune TUI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/CunliangGeng/dictune/main/install.sh | bash

set -e

REPO="CunliangGeng/dictune"
INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="dictune"

# Check for required download tool
DOWNLOADER=""
if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
else
    echo "Error: curl or wget is required but neither is installed." >&2
    exit 1
fi

download() {
    local url="$1"
    local output="$2"

    if [ "$DOWNLOADER" = "curl" ]; then
        if [ -n "$output" ]; then
            curl -fsSL -o "$output" "$url"
        else
            curl -fsSL "$url"
        fi
    else
        if [ -n "$output" ]; then
            wget -q -O "$output" "$url"
        else
            wget -q -O - "$url"
        fi
    fi
}

# Detect OS
case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "Windows is not supported by this installer." >&2
        echo "Download the .exe manually from https://github.com/$REPO/releases/latest" >&2
        exit 1
        ;;
    *)
        echo "Unsupported operating system: $(uname -s)" >&2
        exit 1
        ;;
esac

# Detect architecture
case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
        echo "Unsupported architecture: $(uname -m)" >&2
        exit 1
        ;;
esac

# Detect Rosetta 2 on macOS — prefer native arm64 binary
if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
    if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null)" = "1" ]; then
        arch="arm64"
    fi
fi

asset="dictune-${os}-${arch}"
echo "Detected platform: ${os}-${arch}"

# Get latest release tag
echo "Fetching latest release..."
tag=""
if [ "$DOWNLOADER" = "curl" ]; then
    tag=$(curl -fsSL -w '%{redirect_url}' -o /dev/null "https://github.com/$REPO/releases/latest" 2>/dev/null | grep -oE '[^/]+$') || true
else
    tag=$(wget --server-response --max-redirect=0 "https://github.com/$REPO/releases/latest" 2>&1 | grep -i location | grep -oE '[^/]+$' | tr -d '\r') || true
fi

if [ -z "$tag" ]; then
    echo "Error: no releases found. Visit https://github.com/$REPO/releases for details." >&2
    exit 1
fi
echo "Latest release: $tag"

# Download the binary
download_url="https://github.com/$REPO/releases/download/${tag}/${asset}"
echo "Downloading ${asset}..."

tmp=$(mktemp)
if ! download "$download_url" "$tmp"; then
    echo "Error: download failed. Check that a release exists for your platform." >&2
    rm -f "$tmp"
    exit 1
fi

# Install
mkdir -p "$INSTALL_DIR"
mv "$tmp" "$INSTALL_DIR/$BINARY_NAME"
chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Add to PATH if needed
add_to_path() {
    local rc_file="$1"
    if [ -f "$rc_file" ]; then
        if ! grep -q "$INSTALL_DIR" "$rc_file" 2>/dev/null; then
            echo "" >> "$rc_file"
            echo "# Dictune" >> "$rc_file"
            echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$rc_file"
            return 0
        fi
    fi
    return 1
}

if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
    added=false
    shell_name=$(basename "${SHELL:-/bin/bash}")
    case "$shell_name" in
        zsh)  add_to_path "$HOME/.zshrc" && added=true ;;
        bash) add_to_path "$HOME/.bashrc" && added=true ;;
        fish)
            mkdir -p "$HOME/.config/fish"
            if ! grep -q "$INSTALL_DIR" "$HOME/.config/fish/config.fish" 2>/dev/null; then
                echo "" >> "$HOME/.config/fish/config.fish"
                echo "# Dictune" >> "$HOME/.config/fish/config.fish"
                echo "fish_add_path $INSTALL_DIR" >> "$HOME/.config/fish/config.fish"
                added=true
            fi
            ;;
    esac
    if [ "$added" = true ]; then
        echo "Added $INSTALL_DIR to PATH in your shell profile."
        echo "Restart your shell or run: export PATH=\"$INSTALL_DIR:\$PATH\""
    fi
fi

echo ""
echo "Dictune installed to $INSTALL_DIR/$BINARY_NAME"
echo "Run 'dictune' to start."
