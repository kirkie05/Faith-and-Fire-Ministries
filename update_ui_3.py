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
        content = f.read()

    # We use a state machine to safely find className inside <input, <textarea, <select
    new_content = ""
    i = 0
    in_target_tag = False
    
    while i < len(content):
        if not in_target_tag:
            # Check for <input, <textarea, <select
            if content[i:].startswith('<input') or content[i:].startswith('<textarea') or content[i:].startswith('<select'):
                in_target_tag = True
                new_content += content[i]
            else:
                new_content += content[i]
        else:
            # We are inside a target tag. Wait for the end of the tag. 
            # We must handle > correctly, ignoring it if it's in a string or lambda =>
            # A simple heuristic: if we see className="...", we replace it.
            if content[i:].startswith('className="'):
                # find the closing quote
                end_quote = content.find('"', i + 11)
                if end_quote != -1:
                    class_str = content[i+11:end_quote]
                    new_class_str = clean_classes(class_str)
                    if new_class_str:
                        new_content += f'className="{new_class_str}"'
                    else:
                        new_content += ''
                    i = end_quote
                else:
                    new_content += content[i]
            elif content[i:].startswith('/>'):
                in_target_tag = False
                new_content += '/>'
                i += 1
            elif content[i] == '>' and content[i-1] != '=': # crude check to avoid =>
                in_target_tag = False
                new_content += content[i]
            else:
                new_content += content[i]
        i += 1
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("UI update 3 complete.")
