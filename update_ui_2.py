import os
import re
import glob

src_dir = '/Users/macbookpro/Documents/ClickChurch Projects/Faith & Fire/src/components'
files = glob.glob(os.path.join(src_dir, '*.tsx'))

# Let's completely replace className="..." for inputs
def clean_inputs(match):
    tag = match.group(0)
    # just remove className from input/textarea/select unless it has specific layout ones
    class_match = re.search(r'className="([^"]+)"', tag)
    if not class_match:
        return tag
    
    classes = class_match.group(1).split()
    keep = []
    for c in classes:
        # Keep layout related classes but strip styling
        if c.startswith('w-') or c.startswith('h-') or c.startswith('mt-') or c.startswith('mb-') or c.startswith('ml-') or c.startswith('mr-') or c.startswith('flex') or c.startswith('hidden') or c.startswith('block'):
            keep.append(c)
            
    if keep:
        new_c = f'className="{" ".join(keep)}"'
    else:
        new_c = ''
        
    return tag.replace(class_match.group(0), new_c)

def clean_buttons(match):
    tag = match.group(0)
    class_match = re.search(r'className="([^"]+)"', tag)
    if not class_match:
        return tag
        
    class_str = class_match.group(1)
    
    # Check if it's an action button
    # Usually has bg- and text-white or similar
    is_action = ('bg-' in class_str and 'text-white' in class_str) or ('bg-amber-' in class_str) or ('bg-[#0a192f]' in class_str) or ('bg-[#38bdf8]' in class_str) or ('hover:bg-' in class_str and 'font-black' in class_str)
    
    if is_action:
        if 'text-[10px]' in class_str or 'text-xs' in class_str or 'py-1' in class_str or 'py-2' in class_str:
            new_class = 'btn-primary-sm'
        else:
            new_class = 'btn-primary'
            
        keep = []
        for c in class_str.split():
            if c.startswith('w-') or c.startswith('mt-') or c.startswith('mb-') or c.startswith('absolute') or c.startswith('relative') or c.startswith('z-'):
                if c not in ['w-full', 'relative', 'z-10']:
                    keep.append(c)
                    
        final = [new_class] + keep
        # if w-full was in original, add it back explicitly
        if 'w-full' in class_str.split():
            final.append('w-full')
            
        return tag.replace(class_match.group(0), f'className="{" ".join(final)}"')
        
    return tag

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = re.sub(r'<(input|textarea|select)[^>]*>', clean_inputs, content)
    content = re.sub(r'<button[^>]*>', clean_buttons, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("UI update 2 complete.")
