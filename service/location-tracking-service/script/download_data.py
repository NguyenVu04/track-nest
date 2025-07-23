import gdown
import zipfile
import os

# Google Drive file ID from your link
file_id = '1jTzjRkRrT_FpP8PxC4JPw3524Vl3e1yo'
url = f'https://drive.google.com/uc?id={file_id}'
output = 'Geolife Trajectories.zip'  # Name of the downloaded zip file

# Download
gdown.download(url, output, quiet=False)

# Extract
extract_dir = '../data'
os.makedirs(extract_dir, exist_ok=True)
with zipfile.ZipFile(output, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

# Clean up the zip file after extraction
os.remove(output)

print(f'Files extracted to {extract_dir}/')