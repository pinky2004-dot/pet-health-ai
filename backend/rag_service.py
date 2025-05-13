from embedding_manager import EmbeddingManager
from pdf_processor import PDFProcessor
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RAGService:
    def __init__(self):
        """
        Initialize the RAG service with embedding manager, PDF processor, and OpenAI client
        """
        self.embedding_manager = EmbeddingManager()
        self.pdf_processor = PDFProcessor()
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1")
        print(f"Using OpenAI model: {self.model}")
    
    def index_documents(self, pdf_directory):
        """
        Process PDFs and index them in Pinecone
        
        Args:
            pdf_directory: Directory containing PDF files
            
        Returns:
            Number of chunks indexed
        """
        # Process PDFs
        chunks = self.pdf_processor.process_directory(pdf_directory)
        
        # Create embeddings and store in Pinecone
        num_indexed = self.embedding_manager.upsert_documents(chunks)
        
        return num_indexed
    
    def generate_response(self, user_query, top_k=3):
        """
        Generate a response to a user query using RAG
        
        Args:
            user_query: User's question or message
            top_k: Number of relevant documents to retrieve
            
        Returns:
            Generated AI response
        """
        # Query for relevant documents
        results = self.embedding_manager.query_similar(user_query, top_k=top_k)
        
        # Extract contexts from results
        contexts = []
        for match in results.matches:
            if "text" in match.metadata:
                contexts.append(match.metadata["text"])
        
        # Combine contexts
        context_text = "\n\n".join(contexts)
        
        # Create prompt with context
        prompt = f"""Answer the question based on the following context. If the answer cannot be found in the context, say "I don't have enough information to answer that question." but try to be helpful.

Context:
{context_text}

Question: {user_query}

Answer:"""
        
        # Generate response using OpenAI
        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are PetHealth AI, a helpful assistant specializing in pet health information."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        return response.choices[0].message.content