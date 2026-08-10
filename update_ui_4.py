import os
import re
import glob

src_dir = '/Users/macbookpro/Documents/ClickChurch Projects/Faith & Fire/src/components'
files = glob.glob(os.path.join(src_dir, '*.tsx'))

def clean_classes(class_str):
    classes = class_str.split()
    keep = []
    for c in classes:
        if c.startswith('w-') or c.startswith('h-') or c.startswith('mt-') or c.startswith('mb-') or c.startswith('ml-') or c.startswith('mr-') or c.startswith('flex') or c.startswith('hidden') or c.startswith('block') or c.startswith('grid'):
            keep.append(c)
    return " ".join(keep)

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_tag = False
    for line in lines:
        new_line = line
        
        if '<input' in line or '<textarea' in line or '<select' in line or in_tag:
            # We are inside or starting an input tag
            # If it spans multiple lines, we need to track it
            if '<input' in line or '<textarea' in line or '<select' in line:
                in_tag = True
                
            # Replace className inside this line
            class_match = re.search(r'className="([^"]+)"', new_line)
            if class_match:
                new_class = clean_classes(class_match.group(1))
                if new_class:
                    new_line = new_line.replace(class_match.group(0), f'className="{new_class}"')
                else:
                    new_line = new_line.replace(f' {class_match.group(0)}', '')
                    new_line = new_line.replace(class_match.group(0), '')
            
            # Check if tag ends on this line
            if '/>' in line or ('</' in line) or ('>' in line and '=>' not in line): 
                # Very crude, but covers most cases where tag ends
                in_tag = False
        
        new_lines.append(new_line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

print("UI update 4 complete.")
