import streamlit as st

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


# ---------------- UI ----------------
st.title("📄 Resume Knowledge Assistant")

# ---------------- Embeddings ----------------
embedding = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

# ---------------- Load Vector DB ----------------
db = Chroma(
    persist_directory="chroma_db",
    embedding_function=embedding
)

retriever = db.as_retriever(search_kwargs={"k": 3})

# ---------------- Load LLM ----------------
llm = Ollama(model="phi3:mini")

# ---------------- Prompt ----------------
prompt = ChatPromptTemplate.from_template("""
Answer ONLY using the resume context below.

Context:
{context}

Question:
{question}
""")

# Format retrieved documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# ---------------- RAG Pipeline (LCEL) ----------------
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough(),
    }
    | prompt
    | llm
    | StrOutputParser()
)

# ---------------- User Input ----------------
query = st.text_input("Ask a question about the resume")

if query:
    answer = rag_chain.invoke(query)
    st.write(answer)