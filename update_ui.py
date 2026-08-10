import os
import re
import glob

# Search in all tsx files in src/components
src_dir = '/Users/macbookpro/Documents/ClickChurch Projects/Faith & Fire/src/components'

files = glob.glob(os.path.join(src_dir, '*.tsx'))

# 1. Clean form inputs
# We want to remove long class names from <input>, <textarea>, and <select> 
# that might conflict with our new global styles. We'll just strip the className entirely
# or reduce it to something simple if needed. But for React, it's safe to just remove className if it's purely styling.
# Wait, some inputs might have specific widths or margins. Let's just remove the common styling classes like bg-*, border-*, text-*, rounded-*, focus:*

classes_to_remove = [
    r'bg-\[[^\]]+\]', r'bg-\w+-\d+', r'bg-\w+',
    r'border-\[[^\]]+\]', r'border-\w+-\d+', r'border',
    r'text-\[[^\]]+\]', r'text-\w+-\d+',
    r'placeholder-\w+-\d+',
    r'rounded-\w+', r'rounded',
    r'focus:outline-none', r'focus:border-\[[^\]]+\]', r'focus:border-\w+-\d+', 
    r'focus:ring-\d+', r'focus:ring-\[[^\]]+\]', r'focus:ring-\w+-\d+',
    r'transition-all', r'transition-colors',
    r'p-\d+', r'px-\d+', r'py-\d+',
    r'w-full'
]

def clean_input_classes(match):
    tag_content = match.group(0)
    # Find className="..."
    class_match = re.search(r'className="([^"]+)"', tag_content)
    if not class_match:
        return tag_content
    
    classes = class_match.group(1).split()
    new_classes = []
    
    for cls in classes:
        # Check if cls matches any of the patterns to remove
        should_remove = False
        for pattern in classes_to_remove:
            if re.fullmatch(pattern, cls):
                should_remove = True
                break
        if not should_remove:
            new_classes.append(cls)
            
    if new_classes:
        new_class_str = f'className="{" ".join(new_classes)}"'
    else:
        new_class_str = ''
        
    new_tag_content = tag_content.replace(class_match.group(0), new_class_str)
    # clean up empty className="" or spaces
    new_tag_content = re.sub(r'\s+className=""', '', new_tag_content)
    return new_tag_content

# 2. Update Action Buttons
# We want to find <button className="..."> that look like action buttons and replace their classes with btn-primary or btn-primary-sm
# A button is likely an action button if it has bg-*, text-white, px-*, py-* etc.
# We skip buttons that are purely icons (like close buttons) which usually have w-8 h-8, or just p-1, text-neutral-* without a bg.
def update_button_classes(match):
    tag_content = match.group(0)
    class_match = re.search(r'className="([^"]+)"', tag_content)
    if not class_match:
        return tag_content
    
    class_str = class_match.group(1)
    
    # Check if it's an action button
    # Usually has bg- and px-
    if ('bg-' in class_str or 'hover:bg-' in class_str) and 'px-' in class_str:
        # Determine if small
        if 'py-1' in class_str or 'py-2' in class_str or 'text-[10px]' in class_str or 'text-xs' in class_str and 'py-3' not in class_str:
            new_class = 'btn-primary-sm'
        else:
            new_class = 'btn-primary'
            
        # We need to preserve some structural classes if they exist, like w-full, absolute, mt-4, etc.
        preserved = []
        for cls in class_str.split():
            if cls.startswith('w-') or cls.startswith('mt-') or cls.startswith('mb-') or cls.startswith('absolute') or cls.startswith('relative') or cls.startswith('z-'):
                if cls not in ['w-full', 'relative', 'z-10']: # these are already in btn-primary
                    preserved.append(cls)
        
        final_classes = [new_class] + preserved
        new_class_str = f'className="{" ".join(final_classes)}"'
        return tag_content.replace(class_match.group(0), new_class_str)
        
    return tag_content

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Process inputs, textareas, selects
    content = re.sub(r'<(input|textarea|select)[^>]+>', clean_input_classes, content)
    
    # Process buttons
    content = re.sub(r'<button[^>]+>', update_button_classes, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("UI update complete.")
