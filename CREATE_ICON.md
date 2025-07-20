# Creating the Extension Icon

## Quick Solution: Use Icons8 Rocket Launch Icon

1. **Download the icon**:
   ```bash
   curl -o icon.png "https://img.icons8.com/?id=92053&format=png&size=128"
   ```

2. **Or manually**:
   - Visit: https://img.icons8.com/?id=92053&format=png&size=128
   - Save the image as `icon.png` in the root directory

## Alternative: Create Custom Icon

If you want to create a custom icon based on our SVG designs:

1. **Convert SVG to PNG**:
   ```bash
   # Using ImageMagick (if installed)
   convert extension-icon.svg -resize 128x128 icon.png
   
   # Using Inkscape (if installed)
   inkscape extension-icon.svg --export-png=icon.png --export-width=128 --export-height=128
   ```

2. **Online converters**:
   - Upload `extension-icon.svg` to any SVG to PNG converter
   - Set size to 128x128 pixels
   - Download as `icon.png`

## Verify Icon

After creating `icon.png`:

1. **Check the file exists**:
   ```bash
   ls -la icon.png
   ```

2. **Package the extension**:
   ```bash
   npm run package
   ```

3. **Verify icon is included**:
   ```bash
   npx vsce ls | grep icon.png
   ```

The icon should now be included in the extension package and visible in the VSCode marketplace.
