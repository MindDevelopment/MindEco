# Linking MindEco

This guide explains how to link MindEco globally so you can use the `eco` command from anywhere in your terminal.

## Method 1: npm link (Recommended)

The easiest way to make `eco` available globally:

```bash
# Navigate to the MindEco directory
cd /path/to/MindEco

# Create global symlink
npm link
```

After linking, you can run MindEco from anywhere:

```bash
eco
```

To unlink later:

```bash
npm unlink -g mind-eco
```

## Method 2: Manual Symlink

Create a manual symlink in your system's binary directory:

```bash
# Create symlink in /usr/local/bin
sudo ln -s /path/to/MindEco/eco.js /usr/local/bin/eco

# Make sure it's executable
chmod +x /path/to/MindEco/eco.js
```

To remove:

```bash
sudo rm /usr/local/bin/eco
```

## Method 3: Alias

Add an alias to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# Add to ~/.bashrc or ~/.zshrc
alias eco='node /path/to/MindEco/eco.js'
```

Reload your shell configuration:

```bash
source ~/.bashrc
# or
source ~/.zshrc
```

## Method 4: PATH Variable

Add the MindEco directory to your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:/path/to/MindEco"
```

Then make the script executable and add a shebang:

```bash
chmod +x /path/to/MindEco/eco.js
```

Reload your shell configuration:

```bash
source ~/.bashrc
```

## Verification

After linking using any method, verify it works:

```bash
# Check if eco command is available
which eco

# Run MindEco
eco
```

## Troubleshooting

### Command not found

If `eco` command is not found after linking:

1. Check if the symlink exists:
   ```bash
   ls -la /usr/local/bin/eco
   ```

2. Verify the script is executable:
   ```bash
   chmod +x /path/to/MindEco/eco.js
   ```

3. Check your PATH:
   ```bash
   echo $PATH
   ```

### Permission denied

If you get permission errors:

```bash
# Make script executable
chmod +x /path/to/MindEco/eco.js

# For npm link, you might need sudo
sudo npm link
```
