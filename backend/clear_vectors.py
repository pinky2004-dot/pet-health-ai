# Create a simple script to delete all vectors
import os
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

def clear_pinecone_index():
    # Initialize Pinecone
    pc = Pinecone(
        api_key=os.getenv("PINECONE_API_KEY")
    )
    
    # Connect to the index
    index_name = os.getenv("PINECONE_INDEX_NAME", "pet-health-rag")
    index = pc.Index(index_name)
    
    # Delete all vectors
    index.delete(delete_all=True)
    
    print(f"Deleted all vectors from index: {index_name}")

if __name__ == "__main__":
    clear_pinecone_index()