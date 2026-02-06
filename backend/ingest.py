from vector_store import VectorStore
import re


def ingest_standards():
    print("📖 Reading standards.txt...")

    try:
        with open("data/standards.txt", "r") as f:
            text = f.read()
    except FileNotFoundError:
        print("❌ Error: data/standards.txt not found.")
        return

    # Split the file by the Headers (lines starting with [SECTOR...)
    # This regex finds "[SECTOR: ...]" and splits the text based on it
    sections = re.split(r'(\[SECTOR:.*?\])', text)

    chunks = []
    metadatas = []

    current_source = "UNKNOWN"

    # Iterate through the split parts
    for part in sections:
        part = part.strip()
        if not part:
            continue

        # If this part is a Header, save it as the current source
        if part.startswith("[SECTOR:"):
            # Extract just the name inside brackets, e.g., "MEDICAL - HIPAA-SEC-2023"
            current_source = part.replace(
                "[SECTOR:", "").replace("]", "").strip()
        else:
            # This is the actual rule text. Add it to our list.
            chunks.append(part)
            metadatas.append({"source": current_source})

    print(f"🧩 Found {len(chunks)} rules across various sectors.")
    print(f"🏷️  Sources detected: {set(m['source'] for m in metadatas)}")

    # Initialize DB
    db = VectorStore()

    # Add to database
    db.add_texts(chunks, metadatas)

    print("✅ Success! Database updated with correct Sector labels.")


if __name__ == "__main__":
    ingest_standards()
