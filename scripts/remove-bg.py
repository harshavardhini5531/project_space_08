#!/usr/bin/env python3
# scripts/remove-bg.py
# Removes background from a student image and saves the result
# Usage: python3 scripts/remove-bg.py <input_url_or_path> <output_path>

import sys
import os
from rembg import remove
from PIL import Image
import io
import requests

def remove_background(input_source, output_path):
    try:
        # Load image from URL or file path
        if input_source.startswith('http'):
            response = requests.get(input_source, verify=False, timeout=15)
            if response.status_code != 200:
                print(f"ERROR: Failed to fetch image: {response.status_code}")
                sys.exit(1)
            input_data = response.content
        else:
            with open(input_source, 'rb') as f:
                input_data = f.read()

        # Remove background
        output_data = remove(input_data)

        # Save as PNG with transparency
        img = Image.open(io.BytesIO(output_data))
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        img.save(output_path, 'PNG')
        print(f"OK: {output_path}")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python3 remove-bg.py <input_url_or_path> <output_path>")
        sys.exit(1)
    
    remove_background(sys.argv[1], sys.argv[2])