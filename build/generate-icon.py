from PIL import Image, ImageDraw, ImageFont
import os

size = 512
img = Image.new('RGBA', (size, size), (15, 17, 21, 255))
draw = ImageDraw.Draw(img)

# Rounded background
radius = 64
draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(15, 17, 21, 255), outline=(42, 45, 54, 255), width=4)

# Screen rectangle
screen_rect = [80, 80, size - 80, 360]
draw.rounded_rectangle(screen_rect, radius=20, fill=(24, 26, 32, 255), outline=(14, 165, 233, 255), width=8)

# Play triangle
cx, cy = (screen_rect[0] + screen_rect[2]) // 2, (screen_rect[1] + screen_rect[3]) // 2
points = [(cx - 35, cy - 40), (cx - 35, cy + 40), (cx + 45, cy)]
draw.polygon(points, fill=(14, 165, 233, 255))

# Decorative circles
draw.ellipse([size - 140, size - 160, size - 60, size - 80], fill=(14, 165, 233, 80))
draw.ellipse([size - 200, size - 120, size - 140, size - 60], fill=(139, 92, 246, 100))

# Text
try:
    font_large = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 72)
    font_small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 28)
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

bbox = draw.textbbox((0, 0), "VM Pro", font=font_large)
text_w = bbox[2] - bbox[0]
draw.text(((size - text_w) // 2, 390), "VM Pro", font=font_large, fill=(226, 228, 233, 255))

bbox2 = draw.textbbox((0, 0), "VideoMap", font=font_small)
text_w2 = bbox2[2] - bbox2[0]
draw.text(((size - text_w2) // 2, 470), "VideoMap", font=font_small, fill=(139, 146, 168, 255))

os.makedirs('build', exist_ok=True)
img.save('build/icon.png')

# Create multi-size ICO
img_256 = img.resize((256, 256), Image.LANCZOS)
img_128 = img.resize((128, 128), Image.LANCZOS)
img_64 = img.resize((64, 64), Image.LANCZOS)
img_48 = img.resize((48, 48), Image.LANCZOS)
img_32 = img.resize((32, 32), Image.LANCZOS)
img_16 = img.resize((16, 16), Image.LANCZOS)
img.save('build/icon.ico', sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)], format='ICO')
print('Generated build/icon.png and build/icon.ico')
