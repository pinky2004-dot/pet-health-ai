import os
import time
from openai import OpenAI
import numpy as np
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

class EmbeddingManager:
    def __init__(self):
        """
        Initialize the embedding manager with OpenAI and Pinecone clients
        """
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # We'll use text-embedding-3-small which has 1536 dimensions
        # but we'll adapt it to work with the 2048-dimension index
        self.embedding_model = "text-embedding-3-large"
        self.pinecone_dimension = 3072  # Your Pinecone index dimension
        
        # Initialize Pinecone with new client pattern
        self.pc = Pinecone(
            api_key=os.getenv("PINECONE_API_KEY")
        )
        
        # Get index
        index_name = os.getenv("PINECONE_INDEX_NAME", "pet-health-rag")
        
        # Connect to the existing index
        try:
            self.index = self.pc.Index(index_name)
            print(f"Connected to Pinecone index: {index_name}")
        except Exception as e:
            print(f"Error connecting to Pinecone index: {str(e)}")
            raise
    
    def create_embedding(self, text):
        """
        Create an embedding for a text using OpenAI and adapt it to the
        Pinecone index dimension
        
        Args:
            text: Text to create embedding for
            
        Returns:
            Embedding vector adapted to Pinecone dimensions
        """
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        
        embedding = response.data[0].embedding
        
        # Adapt the embedding to match Pinecone index dimensions
        adapted_embedding = self._adapt_embedding_dimension(embedding, self.pinecone_dimension)
        
        return adapted_embedding
    
    def _adapt_embedding_dimension(self, embedding, target_dim):
        """
        Adapt an embedding vector to the target dimension
        
        Args:
            embedding: The original embedding vector
            target_dim: The target dimension
            
        Returns:
            Adapted embedding vector with target dimension
        """
        current_dim = len(embedding)
        
        # If dimensions match, return as is
        if current_dim == target_dim:
            return embedding
        
        # If current dimension is larger, truncate
        elif current_dim > target_dim:
            return embedding[:target_dim]
        
        # If current dimension is smaller, pad with zeros
        else:
            return embedding + [0.0] * (target_dim - current_dim)
    
    def upsert_documents(self, documents):
        """
        Create embeddings for documents and insert them into Pinecone
        
        Args:
            documents: List of document chunks with text and metadata
            
        Returns:
            Number of vectors inserted
        """
        batch_size = 100  # Pinecone recommended batch size
        vectors = []
        
        for i, doc in enumerate(documents):
            # Create embedding for document text
            embedding = self.create_embedding(doc.page_content)
            
            # Create vector record
            vector = {
                "id": f"doc_{i}",
                "values": embedding,
                "metadata": {
                    "text": doc.page_content,
                    **doc.metadata
                }
            }
            
            vectors.append(vector)
            
            # When batch is full or at end of documents, upsert to Pinecone
            if len(vectors) >= batch_size or i == len(documents) - 1:
                self.index.upsert(vectors=vectors)
                print(f"Inserted batch of {len(vectors)} vectors")
                vectors = []
        
        return len(documents)
    
    def query_similar(self, query_text, top_k=5):
        """
        Query Pinecone for similar documents
        
        Args:
            query_text: Query text
            top_k: Number of results to return
            
        Returns:
            List of similar documents with scores
        """
        # Create embedding for query
        query_embedding = self.create_embedding(query_text)
        
        # Query Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        return results