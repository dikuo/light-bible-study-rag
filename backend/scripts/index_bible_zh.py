import json
from openai import OpenAI
from pinecone import Pinecone
from dotenv import load_dotenv
import os

load_dotenv()
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index(os.environ['PINECONE_INDEX_NAME'])

BOOK_NAMES_CHINESE = {
    "GEN": "创世纪", "EXO": "出埃及记", "LEV": "利未记", "NUM": "民数记",
    "DEU": "申命记", "JOS": "约书亚记", "JDG": "士师记", "RUT": "路得记",
    "1SA": "撒母耳记上", "2SA": "撒母耳记下", "1KI": "列王纪上", "2KI": "列王纪下",
    "1CH": "历代志上", "2CH": "历代志下", "EZR": "以斯拉记", "NEH": "尼希米记",
    "EST": "以斯帖记", "JOB": "约伯记", "PSA": "诗篇", "PRO": "箴言",
    "ECC": "传道书", "SNG": "雅歌", "ISA": "以赛亚书", "JER": "耶利米书",
    "LAM": "耶利米哀歌", "EZK": "以西结书", "DAN": "但以理书", "HOS": "何西阿书",
    "JOL": "约珥书", "AMO": "阿摩司书", "OBA": "俄巴底亚书", "JON": "约拿书",
    "MIC": "弥迦书", "NAM": "那鸿书", "HAB": "哈巴谷书", "ZEP": "西番雅书",
    "HAG": "哈该书", "ZEC": "撒迦利亚书", "MAL": "玛拉基书",
    "MAT": "马太福音", "MRK": "马可福音", "LUK": "路加福音", "JHN": "约翰福音",
    "ACT": "使徒行传", "ROM": "罗马书", "1CO": "哥林多前书", "2CO": "哥林多后书",
    "GAL": "加拉太书", "EPH": "以弗所书", "PHP": "腓立比书", "COL": "歌罗西书",
    "1TH": "帖撒罗尼迦前书", "2TH": "帖撒罗尼迦后书", "1TI": "提摩太前书",
    "2TI": "提摩太后书", "TIT": "提多书", "PHM": "腓利门书", "HEB": "希伯来书",
    "JAS": "雅各书", "1PE": "彼得前书", "2PE": "彼得后书", "1JN": "约翰一书",
    "2JN": "约翰二书", "3JN": "约翰三书", "JUD": "犹大书", "REV": "启示录"
}

with open('backend/data/cuv_bible.json', 'r', encoding='utf-8') as f:
    verses = json.load(f)
    BATCH_SIZE = 100
    for i in range(0, len(verses), BATCH_SIZE):
        batch = verses[i: i + BATCH_SIZE]
        texts = [verse['text'] for verse in batch]
        response = openai_client.embeddings.create(
            model='text-embedding-3-small',
            input=texts,
            dimensions=512
        )
        vectors = []
        for verse, embedding_item in zip(batch, response.data):
            vector_id = f"{verse['book']}-{verse['chapter']}-{verse['verse']}"
            vectors.append({
                "id": vector_id,
                "values": embedding_item.embedding,
                "metadata": {
                    "text": verse['text'],
                    'book': BOOK_NAMES_CHINESE.get(verse['book'], verse['book']),
                    'chapter': verse['chapter'],
                    'verse': verse['verse']
                }
            })

        index.upsert(vectors=vectors, namespace="chinese")

        print(f"Upserted batch {i//BATCH_SIZE + 1}/{len(verses)//BATCH_SIZE + 1}")

    print("Done Indexing...")
    print(f"Pinecone index stats: {index.describe_index_stats()}")
