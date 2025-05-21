#logging
import logging

import os
import time
from openai import OpenAI
import numpy as np
from dotenv import load_dotenv
from pinecone import Pinecone

# Get a logger for this module
logger = logging.getLogger(__name__) # Logger name will be 'embedding_manager'

# Load environment variables
load_dotenv()

class EmbeddingManager:
    def __init__(self):
        """
        Initialize the embedding manager with OpenAI and Pinecone clients
        """
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        self.embedding_model = "text-embedding-3-large"
        self.pinecone_dimension = 3072  # Pinecone index dimension
        logger.debug(f"EmbeddingManager configured: OpenAI model='{self.embedding_model}', Pinecone dimension={self.pinecone_dimension}.")
        
        # Initialize Pinecone with new client pattern
        logger.debug("Initializing Pinecone client for EmbeddingManager...")
        self.pc = Pinecone(
            api_key=os.getenv("PINECONE_API_KEY")
        )
        logger.info("Pinecone client initialized for EmbeddingManager.")
        
        # Get index
        index_name = os.getenv("PINECONE_INDEX_NAME", "pet-health-rag")
        logger.info(f"EmbeddingManager attempting to connect to Pinecone index: '{index_name}'.")
        
        # Connect to the existing index
        try:
            self.index = self.pc.Index(index_name)
            logger.info(f"Successfully connected to Pinecone index '{index_name}'.")
        except Exception as e:
            logger.error(f"Error connecting to Pinecone index '{index_name}' in EmbeddingManager: {e}", exc_info=True)
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
        text_snippet = (text[:75] + "...") if len(text) > 75 else text
        logger.debug(f"Creating OpenAI embedding using model '{self.embedding_model}' for text snippet: '{text_snippet}'")
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        
        embedding = response.data[0].embedding
        logger.debug(f"Successfully created embedding of dimension {len(embedding)} for text snippet: '{text_snippet}'.")
        
        # Adapt the embedding to match Pinecone index dimensions
        adapted_embedding = self._adapt_embedding_dimension(embedding, self.pinecone_dimension)
        if len(adapted_embedding) != self.pinecone_dimension:
            logger.warning(f"Adapted embedding dimension {len(adapted_embedding)} does not match target {self.pinecone_dimension} for text snippet: '{text_snippet}'.")
        
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
        
        logger.warning(
            f"Adapting embedding dimension from {current_dim} to {target_dim}. "
            "This indicates a mismatch between embedding model output and Pinecone index dimension. "
            "Ensure they are aligned for optimal performance."
        )
        
        # If current dimension is larger, truncate
        if current_dim > target_dim:
            logger.debug(f"Truncating embedding from {current_dim} to {target_dim}.")
            return embedding[:target_dim]
        else: # If current dimension is smaller, pad with zeros
            logger.debug(f"Padding embedding from {current_dim} to {target_dim} with zeros.")
            return embedding + [0.0] * (target_dim - current_dim)
    
    def upsert_documents(self, documents):
        """
        Create embeddings for documents and insert them into Pinecone
        
        Args:
            documents: List of document chunks with text and metadata
            
        Returns:
            Number of vectors inserted
        """
        if not documents:
            logger.warning("upsert_documents called with an empty list of documents.")
            return 0
            
        logger.info(f"Starting to upsert {len(documents)} Langchain Document objects to Pinecone.")
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
        
        logger.info(f"Finished upserting documents. Total vectors reported as upserted by Pinecone: {vectors}.")
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