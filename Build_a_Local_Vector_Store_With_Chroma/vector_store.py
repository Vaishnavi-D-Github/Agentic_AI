import chromadb

client = chromadb.PersistentClient(path="./my_vector_db")
collection = client.get_or_create_collection(name="my_docs")
print("Chroma client ready")

collection.add(
    documents = ["Python for AI", "ML is subset of AI", "Cricket World Cup 2024", "Deep Learning uses neural nets"],
    metadatas = [{"topic":"tech"}, {"topic":"ai"}, {"topic":"sports"}, {"topic":"ai"}],
    ids=["d1", "d2", "d3", "d4"]
)

results = collection.query(query_texts=["Tell me about AI"], n_results=2)
print("AI Search:", results["documents"])

filtered = collection.query(
    query_texts=["Tell me about Python"],
    n_results=2,
    where={"topic": "tech"}
)
print("Filtered:", filtered["documents"])