from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Load embeddings
embedding = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

# Load vector database
db = Chroma(
    persist_directory="chroma_db",
    embedding_function=embedding
)

retriever = db.as_retriever(search_kwargs={"k": 3})

# Load LLM
llm = Ollama(model="phi3:mini")

# Prompt template
prompt = ChatPromptTemplate.from_template("""
Answer ONLY using the resume context below.

Context:
{context}

Question:
{question}
""")

# Format retrieved docs
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# RAG pipeline (LCEL)
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough(),
    }
    | prompt
    | llm
    | StrOutputParser()
)

# Chat loop
while True:
    query = input("\nAsk about resume: ")
    if query.lower() == "exit":
        break

    answer = rag_chain.invoke(query)
    print("\nAI:", answer)