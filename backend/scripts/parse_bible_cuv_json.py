import xml.etree.ElementTree as ET
import json

tree = ET.parse('backend/data/chi-cuv-simp.usfx.xml')
root = tree.getroot()
books = root.findall('book')

verses = []

for book in books:
    book_id = book.get('id')
    current_chapter = None

    for element in book:
        if element.tag == 'c':
            current_chapter = element.get('id')
        elif element.tag == 'v':
            current_verse = element.get("id")
            current_text = element.tail
            verses.append({
                "book": book_id,
                "chapter": current_chapter,
                "verse": current_verse,
                "text": current_text
            })

with open('backend/data/cuv_bible.json', 'w', encoding='utf-8') as f:
    json.dump(verses, f, ensure_ascii=False, indent=2)