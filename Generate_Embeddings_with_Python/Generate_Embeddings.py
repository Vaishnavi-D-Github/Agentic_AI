from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')

sentences = [
    "I Love Pizza",
    "Pizza is my favourite food",
    "Stock Market is up today"
]

embeddings = model.encode(sentences)
# embeddings.shape -> (3, 384)

scores = cosine_similarity(embeddings)

print("\nSimilarity Scores:")
for i in range(len(sentences)):
    for j in range(i+1, len(sentences)):
        print(f"  '{sentences[i]}'")
        print(f"  '{sentences[j]}'")
        print(f"  Score → {scores[i][j]:.2f}\n")