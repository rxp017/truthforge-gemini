import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer


class VectorStore:
    def __init__(self, storage_file="data/vector_store.json"):
        self.storage_file = storage_file
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.embeddings = []
        self.load()

    def add_texts(self, texts, metadatas=None):
        print("🧮 Calculating embeddings (math) for new rules...")
        new_embeddings = self.model.encode(texts)

        for i, text in enumerate(texts):
            self.documents.append({
                "text": text,
                "metadata": metadatas[i] if metadatas else {}
            })
            # Convert to list for JSON saving
            self.embeddings.append(new_embeddings[i].tolist())

        self.save()
        print(f"✅ Saved {len(texts)} rules to {self.storage_file}")

    def search(self, query, top_k=2):
        if not self.documents:
            return []

        # Convert query to vector
        query_vector = self.model.encode([query])[0]

        # Calculate cosine similarity manually (dot product)
        scores = []
        for i, doc_vector in enumerate(self.embeddings):
            score = np.dot(query_vector, doc_vector) / (
                np.linalg.norm(query_vector) * np.linalg.norm(doc_vector)
            )
            scores.append((score, self.documents[i]))

        # Sort by best score
        scores.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scores[:top_k]]

    def save(self):
        os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
        data = {
            "documents": self.documents,
            "embeddings": self.embeddings
        }
        with open(self.storage_file, "w") as f:
            json.dump(data, f)

    def load(self):
        if os.path.exists(self.storage_file):
            with open(self.storage_file, "r") as f:
                data = json.load(f)
                self.documents = data["documents"]
                self.embeddings = data["embeddings"]
